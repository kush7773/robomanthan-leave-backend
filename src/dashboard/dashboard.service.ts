import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  async getEmployeeDashboard(userId: string) {
    const year = this.getCurrentYear();

    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        userId,
        year,
      },
    });

    const recentLeaves = await this.prisma.leave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      year,
      balances,
      recentLeaves,
    };
  }

  async getEmployerDashboard() {
    const year = this.getCurrentYear();

    const employeesCount = await this.prisma.user.count({
      where: { isActive: true },
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
}
