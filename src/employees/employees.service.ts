import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  // ✅ CREATE EMPLOYEE (EMPLOYER ONLY)
  async createEmployee(body: {
    name: string;
    email: string;
    password: string;
    jobRole: string;
    leaveBalances: { type: string; total: number }[];
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      throw new BadRequestException('Employee already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const year = this.getCurrentYear();

    return this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        jobRole: body.jobRole,
        role: 'EMPLOYEE',
        isActive: true,
        leaveBalances: {
          create: body.leaveBalances.map((b) => ({
            type: b.type,
            total: b.total,
            used: 0,
            year, // ✅ REQUIRED
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
      },
    });
  }

  // ✅ LIST ALL ACTIVE EMPLOYEES
  async getAllEmployees() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ VIEW EMPLOYEE DETAILS + LEAVE HISTORY
  async getEmployeeById(employeeId: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        createdAt: true,
        leaves: {
          orderBy: { fromDate: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  // ✅ SOFT DELETE EMPLOYEE
  async deleteEmployee(employeeId: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.user.update({
      where: { id: employeeId },
      data: { isActive: false },
    });

    return { message: 'Employee deactivated successfully' };
  }

  // ✅ EMPLOYER CAN RESET BALANCE MANUALLY (OPTIONAL)
  async resetEmployeeLeaveBalance(
    employeeId: string,
    type: string,
    total: number,
  ) {
    const year = this.getCurrentYear();

    const balance = await this.prisma.leaveBalance.findFirst({
      where: { userId: employeeId, type, year },
    });

    if (!balance) {
      await this.prisma.leaveBalance.create({
        data: {
          userId: employeeId,
          type,
          total,
          used: 0,
          year,
        },
      });
    } else {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          total,
          used: 0,
        },
      });
    }

    return { message: 'Leave balance reset successfully' };
  }
}
