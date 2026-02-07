import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LeaveStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  // ==========================
  // APPLY LEAVE
  // ==========================
  async applyLeave(
    userId: string,
    type: string,
    reason: string,
    fromDate: string,
    toDate: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Employee not found');
    }

    const approvalToken = randomUUID();

    const leave = await this.prisma.leave.create({
      data: {
        userId,
        type,
        reason,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        status: LeaveStatus.PENDING,
        approvalToken,
      },
      include: { user: true },
    });

    // FIX 1: Correct method name is 'sendLeaveRequestToApprover'
    await this.mailService.sendLeaveRequestToApprover({
      employeeName: leave.user.name,
      employeeEmail: leave.user.email,
      type: leave.type,
      reason: leave.reason,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      approvalToken,
    });

    return { message: 'Leave request submitted for approval' };
  }

  // ==========================
  // INTERNAL APPROVAL LOGIC
  // ==========================
  private async approveLeaveInternal(
    leaveId: string,
    decidedBy: 'EMPLOYER_UI' | 'EMAIL',
  ) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave || leave.status !== LeaveStatus.PENDING) {
      throw new NotFoundException('Leave not found or already decided');
    }

    const days =
      Math.ceil(
        (leave.toDate.getTime() - leave.fromDate.getTime()) /
        (1000 * 60 * 60 * 24),
      ) + 1;

    await this.prisma.leave.update({
      where: { id: leave.id },
      data: {
        status: LeaveStatus.APPROVED,
        decidedBy,
        approvalToken: null,
      },
    });

    // Update or create leave balance (upsert to handle missing records)
    const currentYear = new Date().getFullYear();
    await this.prisma.leaveBalance.upsert({
      where: {
        userId_type: {
          userId: leave.userId,
          type: leave.type,
        },
      },
      update: {
        used: {
          increment: days,
        },
      },
      create: {
        userId: leave.userId,
        type: leave.type,
        total: 20, // Default total leaves per year
        used: days,
        year: currentYear,
      },
    });

    // FIX 2: Property must be 'email', not 'employeeEmail'
    await this.mailService.sendLeaveDecisionToEmployee({
      email: leave.user.email,
      name: leave.user.name,
      status: 'APPROVED',
    });

    return { message: 'Leave approved successfully' };
  }

  async approveLeaveById(leaveId: string) {
    return this.approveLeaveInternal(leaveId, 'EMPLOYER_UI');
  }

  async approveLeaveByToken(token: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { approvalToken: token },
    });

    if (!leave) {
      throw new NotFoundException('Invalid or expired token');
    }

    return this.approveLeaveInternal(leave.id, 'EMAIL');
  }

  // ==========================
  // REJECT LEAVE
  // ==========================
  async rejectLeaveById(leaveId: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave || leave.status !== LeaveStatus.PENDING) {
      throw new NotFoundException('Leave not found or already decided');
    }

    await this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.REJECTED,
        decidedBy: 'EMPLOYER_UI',
        approvalToken: null,
      },
    });

    // FIX 3: Property must be 'email', not 'employeeEmail'
    await this.mailService.sendLeaveDecisionToEmployee({
      email: leave.user.email,
      name: leave.user.name,
      status: 'REJECTED',
    });

    return { message: 'Leave rejected successfully' };
  }

  async rejectLeaveByToken(token: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { approvalToken: token },
      include: { user: true },
    });

    if (!leave) {
      throw new NotFoundException('Invalid or expired token');
    }

    return this.rejectLeaveById(leave.id);
  }

  // ==========================
  // READ-ONLY APIs (SAFE)
  // ==========================
  async getEmployeeLeaveHistory(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingLeaves() {
    return this.prisma.leave.findMany({
      where: {
        status: LeaveStatus.PENDING,
        user: { isActive: true },
      },
      include: { user: true },
    });
  }

  async getLeavesByDate(date: string) {
    const d = new Date(date);

    return this.prisma.leave.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        fromDate: { lte: d },
        toDate: { gte: d },
      },
      include: { user: true },
    });
  }

  async getAllLeaveHistory() {
    return this.prisma.leave.findMany({
      include: { user: true },
      orderBy: { fromDate: 'desc' },
    });
  }
}