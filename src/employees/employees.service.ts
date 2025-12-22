import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // CREATE EMPLOYEE
  async createEmployee(
    name: string,
    email: string,
    jobRole: string,
    leaveBalances: { type: string; total: number }[],
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Employee already exists');
    }

    const rawPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        jobRole,
        password: hashedPassword,
        role: Role.EMPLOYEE,
        isActive: true,
      },
    });

    await this.prisma.leaveBalance.createMany({
      data: leaveBalances.map(lb => ({
        userId: user.id,
        type: lb.type,
        total: lb.total,
        used: 0,
      })),
    });

    await this.mailService.sendEmployeeCredentials(email, rawPassword);

    return { message: 'Employee created successfully' };
  }

  // LIST ACTIVE EMPLOYEES
  async listEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: Role.EMPLOYEE,
        isActive: true,
      },
      include: {
        leaveBalances: true,
      },
    });
  }

  // UPDATE EMPLOYEE
  async updateEmployee(
    userId: string,
    jobRole: string,
    leaveBalances: { type: string; total: number }[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Employee not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { jobRole },
    });

    await this.prisma.leaveBalance.deleteMany({
      where: { userId },
    });

    await this.prisma.leaveBalance.createMany({
      data: leaveBalances.map(lb => ({
        userId,
        type: lb.type,
        total: lb.total,
        used: 0,
      })),
    });

    return { message: 'Employee updated successfully' };
  }

  // SOFT DELETE EMPLOYEE
  async softDeleteEmployee(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Employee not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'Employee deactivated successfully' };
  }
}
