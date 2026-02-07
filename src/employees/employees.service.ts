import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) { }

  // ==============================
  // CREATE EMPLOYEE (EMPLOYER)
  // ==============================
  async createEmployee(data: {
    name: string;
    email: string;
    password: string;
    jobRole?: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Employee already exists');
    }

    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

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

    // Initialize leave balances for common leave types
    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave'];
    await Promise.all(
      leaveTypes.map(type =>
        this.prisma.leaveBalance.create({
          data: {
            userId: employee.id,
            type,
            total: 20, // Default 20 days per leave type per year
            used: 0,
            year: currentYear,
          },
        }),
      ),
    );

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
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
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