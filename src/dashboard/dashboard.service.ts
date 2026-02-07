import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getEmployerDashboard() {
    const year = new Date().getFullYear();

    const employeesCount = await this.prisma.user.count({
      where: { role: 'EMPLOYEE', isActive: true },
    });

    const pendingLeaves = await this.prisma.leave.count({
      where: { status: 'PENDING' },
    });

    const leavesThisYear = await this.prisma.leave.count({
      where: {
        fromDate: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    return {
      year,
      employeesCount,
      pendingLeaves,
      leavesThisYear,
    };
  }

  async getEmployeeDashboard(userId: string) {
    const year = new Date().getFullYear();

    // Get employee's leave statistics
    const totalLeaves = await this.prisma.leave.count({
      where: { userId },
    });

    const pendingLeaves = await this.prisma.leave.count({
      where: { userId, status: 'PENDING' },
    });

    const approvedLeaves = await this.prisma.leave.count({
      where: { userId, status: 'APPROVED' },
    });

    const rejectedLeaves = await this.prisma.leave.count({
      where: { userId, status: 'REJECTED' },
    });

    // Get leave balances
    const leaveBalances = await this.prisma.leaveBalance.findMany({
      where: { userId, year },
      select: {
        type: true,
        total: true,
        used: true,
      },
    });

    return {
      year,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      leaveBalances: leaveBalances.map(lb => ({
        type: lb.type,
        total: lb.total,
        used: lb.used,
        remaining: lb.total - lb.used,
      })),
    };
  }
}