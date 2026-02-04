import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ============================
  // CREATE EMPLOYEE (EMPLOYER)
  // ============================
  async createEmployee(
    name: string,
    email: string,
    jobRole: string,
  ) {
    // check duplicate
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Employee already exists');
    }

    // generate password
    const rawPassword = randomBytes(6).toString('hex'); // e.g. a1b2c3

    // hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // create employee
    const employee = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        jobRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // send credentials
    await this.mailService.sendEmployeeCredentials(
      email,
      rawPassword,
    );

    return {
      message: 'Employee created successfully',
      employee,
    };
  }

  // ============================
  // LIST ALL EMPLOYEES (EMPLOYER)
  // ============================
  async getAllEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================
  // GET SINGLE EMPLOYEE + HISTORY
  // ============================
  async getEmployeeById(employeeId: string) {
    return this.prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
        createdAt: true,
        leaves: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // ============================
  // UPDATE EMPLOYEE (EMPLOYER)
  // ============================
  async updateEmployee(
    employeeId: string,
    data: {
      name?: string;
      email?: string;
      jobRole?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: employeeId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        jobRole: true,
      },
    });
  }

  // ============================
  // SOFT DELETE EMPLOYEE
  // ============================
  async deleteEmployee(employeeId: string) {
    await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        isActive: false,
      },
    });

    return { message: 'Employee deleted successfully' };
  }
}