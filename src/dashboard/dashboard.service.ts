import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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
}