import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { randomUUID } from 'crypto';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ===============================
  // APPLY LEAVE
  // ===============================
  async applyLeave(
    userId: string,
    type: string,
    reason: string,
    fromDate: Date,
    toDate: Date,
  ) {
    const approvalToken = randomUUID();

    const leave = await this.prisma.leave.create({
      data: {
        userId,
        type,
        reason,
        fromDate,
        toDate,
        status: 'PENDING',
        approvalToken,
      },
      include: { user: true },
    });

    await this.mailService.sendLeaveRequestToEmployer({
      employeeName: leave.user.name,
      employeeEmail: leave.user.email,
      type: leave.type,
      reason: leave.reason,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      approvalToken,
    });

    return { message: 'Leave applied successfully' };
  }

  // ===============================
  // PENDING LEAVES
  // ===============================
  async getPendingLeaves() {
    return this.prisma.leave.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===============================
  // APPROVE (DASHBOARD)
  // ===============================
  async approveById(leaveId: string, employerId?: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave) throw new NotFoundException('Leave not found');

    await this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        decidedBy: employerId ?? null,
        approvalToken: null,
      },
    });

    await this.mailService.sendLeaveDecisionToEmployee({
      employeeEmail: leave.user.email,
      employeeName: leave.user.name,
      type: leave.type,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      status: 'APPROVED',
    });

    return { message: 'Leave approved' };
  }

  // ===============================
  // REJECT (DASHBOARD)
  // ===============================
  async rejectById(leaveId: string, employerId?: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave) throw new NotFoundException('Leave not found');

    await this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        decidedBy: employerId ?? null,
        approvalToken: null,
      },
    });

    await this.mailService.sendLeaveDecisionToEmployee({
      employeeEmail: leave.user.email,
      employeeName: leave.user.name,
      type: leave.type,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      status: 'REJECTED',
    });

    return { message: 'Leave rejected' };
  }

  // ===============================
  // EMAIL → APPROVE
  // ===============================
  async approveByToken(token: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { approvalToken: token },
      include: { user: true },
    });

    if (!leave) throw new NotFoundException('Invalid token');

    return this.approveById(leave.id);
  }

  // ===============================
  // EMAIL → REJECT
  // ===============================
  async rejectByToken(token: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { approvalToken: token },
      include: { user: true },
    });

    if (!leave) throw new NotFoundException('Invalid token');

    return this.rejectById(leave.id);
  }

  // ===============================
  // CALENDAR
  // ===============================
  async getLeavesByDate(date: Date) {
    return this.prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        fromDate: { lte: date },
        toDate: { gte: date },
      },
      include: { user: { select: { name: true } } },
    });
  }

  // ===============================
  // HISTORY
  // ===============================
  async getEmployeeHistory(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}