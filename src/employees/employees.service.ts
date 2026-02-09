import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  // ==============================
  // CREATE EMPLOYEE (EMPLOYER)
  // ==============================
  async createEmployee(data: {
    name: string;
    email: string;
    password?: string;
    jobRole?: string;
    phone?: string;
    balances?: Array<{ type: string; total: number }>;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Employee already exists');
    }

    // Auto-generate password if not provided
    const plainPassword = data.password || randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const currentYear = new Date().getFullYear();
    const employee = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        jobRole: data.jobRole || null,
        phone: data.phone || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Initialize leave balances
    // Use custom balances if provided, otherwise use defaults
    const leaveBalances = data.balances && data.balances.length > 0
      ? data.balances
      : [
        { type: 'Sick', total: 20 },
        { type: 'Casual', total: 20 },
        { type: 'Paid', total: 20 },
      ];

    await Promise.all(
      leaveBalances.map(balance =>
        this.prisma.leaveBalance.create({
          data: {
            userId: employee.id,
            type: balance.type,
            total: balance.total,
            used: 0,
            year: currentYear,
          },
        }),
      ),
    );

    // Send credentials via email
    await this.mailService.sendEmployeeCredentials(data.email, plainPassword);

    return employee;
  }

  // ==============================
  // GET ALL EMPLOYEES (EMPLOYER)
  // ==============================
  async getAllEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobRole: true,
        createdAt: true,
      },
    });
  }

  // ==============================
  // GET EMPLOYEE BY ID
  // ==============================
  async getEmployeeById(id: string) {
    const currentYear = new Date().getFullYear();

    const employee = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobRole: true,
        isActive: true,
        createdAt: true,
        leaveBalances: {
          where: { year: currentYear },
          select: {
            type: true,
            total: true,
            used: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  // ==============================
  // GET EMPLOYEE LEAVES BY ID
  // ==============================
  async getEmployeeLeaves(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee || employee.role !== 'EMPLOYEE') {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.leave.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        reason: true,
        fromDate: true,
        toDate: true,
        status: true,
        createdAt: true,
      },
    });
  }

  // ==============================
  // UPDATE EMPLOYEE LEAVE BALANCES
  // ==============================
  async updateLeaveBalances(
    id: string,
    leaveBalances: Array<{ type: string; total: number; used?: number }>,
  ) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee || employee.role !== 'EMPLOYEE') {
      throw new NotFoundException('Employee not found');
    }

    // Validate leave balances
    for (const balance of leaveBalances) {
      if (balance.total < 0) {
        throw new BadRequestException('Total leave balance cannot be negative');
      }
      if (balance.used !== undefined && balance.used < 0) {
        throw new BadRequestException('Used leave balance cannot be negative');
      }
      if (balance.used !== undefined && balance.used > balance.total) {
        throw new BadRequestException('Used leaves cannot exceed total leaves');
      }
    }

    const currentYear = new Date().getFullYear();

    // Update each leave balance
    await Promise.all(
      leaveBalances.map(async (balance) => {
        const existing = await this.prisma.leaveBalance.findUnique({
          where: {
            userId_type: {
              userId: id,
              type: balance.type,
            },
          },
        });

        if (existing) {
          // Update existing balance
          const updateData: any = {
            total: balance.total,
          };

          // Only update 'used' if it's provided
          if (balance.used !== undefined) {
            updateData.used = balance.used;
          }

          return this.prisma.leaveBalance.update({
            where: {
              userId_type: {
                userId: id,
                type: balance.type,
              },
            },
            data: updateData,
          });
        } else {
          // Create new balance if it doesn't exist
          return this.prisma.leaveBalance.create({
            data: {
              userId: id,
              type: balance.type,
              total: balance.total,
              used: 0,
              year: currentYear,
            },
          });
        }
      }),
    );

    return { message: 'Leave balances updated successfully' };
  }

  // ==============================
  // UPDATE EMPLOYEE (EMPLOYER)
  // ==============================
  async updateEmployee(
    id: string,
    data: {
      name?: string;
      phone?: string;
      jobRole?: string;
    },
  ) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee || employee.role !== 'EMPLOYEE') {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name ?? employee.name,
        phone: data.phone ?? employee.phone,
        jobRole: data.jobRole ?? employee.jobRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobRole: true,
      },
    });
  }

  // ==============================
  // DELETE EMPLOYEE (SOFT DELETE)
  // ==============================
  async deleteEmployee(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee || employee.role !== 'EMPLOYEE') {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}