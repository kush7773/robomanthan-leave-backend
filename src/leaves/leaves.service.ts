import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LeaveStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // =========================
  // APPLY LEAVE (EMPLOYEE)
  // =========================
  async applyLeave(
    userId: string,
    type: string,
    reason: string,
    fromDate: Date,
    toDate: Date,
  ) {
    const approvalToken = uuid();

    const leave = await this.prisma.leave.create({
      data: {
        userId,
        type,
        reason,
        fromDate,
        toDate,
        status: LeaveStatus.PENDING,
        approvalToken,
      },
      include: {
        user: true,
      },
    });

    // email to employer
    await this.mailService.sendLeaveRequestToApprover({
      employeeName: leave.user.name,
      employeeEmail: leave.user.email,
      type: leave.type,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      reason: leave.reason,
      approvalToken,
    });

    return { message: 'Leave applied successfully' };
  }

  // =========================
  // EMPLOYEE LEAVE HISTORY
  // =========================
  async getEmployeeLeaveHistory(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { fromDate: 'desc' },
    });
  }

  // =========================
  // PENDING LEAVES (EMPLOYER)
  // =========================
  async getPendingLeaves() {
    return this.prisma.leave.findMany({
      where: { status: LeaveStatus.PENDING },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // APPROVE (EMPLOYER UI)
  // =========================
  async approveLeaveById(id: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave not found');

    return this.prisma.leave.update({
      where: { id },
      data: { status: LeaveStatus.APPROVED },
    });
  }

  // =========================
  // REJECT (EMPLOYER UI)
  // =========================
  async rejectLeaveById(id: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave not found');

    return this.prisma.leave.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED },
    });
  }

  // =========================
  // APPROVE VIA EMAIL LINK
  // =========================
  async approveLeaveByToken(token: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { approvalToken: token },
    });

    if (!leave) throw new NotFoundException('Invalid token');

    return this.prisma.leave.update({
      where: { id: leave.id },
      data: {
        status: LeaveStatus.APPROVED,
        approvalToken: null,
      },
    });
  }

  // =========================
  // REJECT VIA EMAIL LINK
  // =========================
  async rejectLeaveByToken(token: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { approvalToken: token },
    });

    if (!leave) throw new NotFoundException('Invalid token');

    return this.prisma.leave.update({
      where: { id: leave.id },
      data: {
        status: LeaveStatus.REJECTED,
        approvalToken: null,
      },
    });
  }
}