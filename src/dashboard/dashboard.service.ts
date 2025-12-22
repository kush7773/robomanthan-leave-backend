import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // EMPLOYER DASHBOARD
  // ==========================
  async getEmployerDashboard() {
    const employeesCount = await this.prisma.user.count({
      where: { role: Role.EMPLOYEE },
    });

    const pendingLeaves = await this.prisma.leave.count({
      where: { status: 'PENDING' },
    });

    const recentLeaves = await this.prisma.leave.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      employeesCount,
      pendingLeaves,
      recentLeaves,
    };
  }

  // ==========================
  // EMPLOYEE DASHBOARD
  // ==========================
  async getEmployeeDashboard(userId: string) {
    const leaveBalances = await this.prisma.leaveBalance.findMany({
      where: { userId },
      select: {
        type: true,
        total: true,
        used: true,
      },
    });

    const leaves = await this.prisma.leave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        fromDate: true,
        toDate: true,
        reason: true,
      },
    });

    return {
      leaveBalances,
      leaves,
    };
  }
}
