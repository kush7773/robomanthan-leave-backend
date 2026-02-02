import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  private getCurrentYear() {
    return new Date().getFullYear();
  }

  private calculateDays(from: Date, to: Date): number {
    return (
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }

  private async getOrCreateBalance(userId: string, type: string) {
    const year = this.getCurrentYear();

    let balance = await this.prisma.leaveBalance.findFirst({
      where: { userId, type, year },
    });

    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: {
          userId,
          type,
          year,
          total: 20,
          used: 0,
        },
      });
    }

    return balance;
  }

  async applyLeave(userId: string, body: any) {
    const fromDate = new Date(body.fromDate);
    const toDate = new Date(body.toDate);

    if (fromDate > toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = this.calculateDays(fromDate, toDate);

    const balance = await this.getOrCreateBalance(userId, body.type);

    if (balance.used + days > balance.total) {
      throw new BadRequestException('Insufficient leave balance');
    }

    const leave = await this.prisma.leave.create({
      data: {
        userId,
        type: body.type,
        reason: body.reason,
        fromDate,
        toDate,
        status: 'PENDING',
      },
    });

    await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { used: balance.used + days },
    });

    return { message: 'Leave applied successfully', leaveId: leave.id };
  }

  async getEmployeeLeaveHistory(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { fromDate: 'desc' },
    });
  }

  async getPendingLeaves() {
    return this.prisma.leave.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { name: true, email: true, jobRole: true },
        },
      },
    });
  }

  async approveLeaveById(leaveId: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave not found');

    await this.prisma.leave.update({
      where: { id: leaveId },
      data: { status: 'APPROVED' },
    });

    return { message: 'Leave approved' };
  }

  async rejectLeaveById(leaveId: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave not found');

    const days = this.calculateDays(leave.fromDate, leave.toDate);
    const year = leave.fromDate.getFullYear();

    const balance = await this.prisma.leaveBalance.findFirst({
      where: { userId: leave.userId, type: leave.type, year },
    });

    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { used: Math.max(balance.used - days, 0) },
      });
    }

    await this.prisma.leave.update({
      where: { id: leaveId },
      data: { status: 'REJECTED' },
    });

    return { message: 'Leave rejected' };
  }

  async getLeavesByDate(date: string) {
    const target = new Date(date);

    return this.prisma.leave.findMany({
      where: {
        fromDate: { lte: target },
        toDate: { gte: target },
        status: 'APPROVED',
      },
      include: {
        user: { select: { name: true, email: true, jobRole: true } },
      },
    });
  }
}
