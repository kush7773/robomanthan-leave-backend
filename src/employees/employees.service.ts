import {
        Injectable,
        BadRequestException,
        NotFoundException,
      } from '@nestjs/common';
      import { PrismaService } from '../prisma/prisma.service';
      import * as bcrypt from 'bcrypt';
      import { Role } from '@prisma/client';
      
      @Injectable()
      export class EmployeesService {
        constructor(private readonly prisma: PrismaService) {}
      
        // ==========================
        // ADD NEW EMPLOYEE
        // ==========================
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
      
          const rawPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(rawPassword, 10);
      
          const employee = await this.prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
              role: Role.EMPLOYEE,
              jobRole,
              isActive: true,
              leaveBalances: {
                create: leaveBalances.map((b) => ({
                  type: b.type,
                  total: b.total,
                  used: 0,
                })),
              },
            },
          });
      
          // credentials email already handled elsewhere (MailService)
      
          return {
            message: 'Employee created successfully',
            employeeId: employee.id,
          };
        }
      
        // ==========================
        // LIST ALL EMPLOYEES
        // ==========================
        async getAllEmployees() {
          return this.prisma.user.findMany({
            where: {
              role: Role.EMPLOYEE,
            },
            select: {
              id: true,
              name: true,
              email: true,
              jobRole: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
        }
      
        // ==========================
        // VIEW EMPLOYEE DETAILS
        // ==========================
        async getEmployeeById(employeeId: string) {
          const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
            select: {
              id: true,
              name: true,
              email: true,
              jobRole: true,
              isActive: true,
              createdAt: true,
              leaveBalances: {
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
      
        // ==========================
        // EMPLOYER VIEW – EMPLOYEE LEAVE HISTORY
        // ==========================
        async getEmployeeLeaveHistory(employeeId: string) {
          return this.prisma.leave.findMany({
            where: {
              userId: employeeId,
            },
            select: {
              id: true,
              type: true,
              reason: true,
              fromDate: true,
              toDate: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              fromDate: 'desc',
            },
          });
        }
      
        // ==========================
        // UPDATE EMPLOYEE (JOB ROLE + BALANCES)
        // ==========================
        async updateEmployee(
          employeeId: string,
          jobRole: string,
          leaveBalances: { type: string; total: number }[],
        ) {
          const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
          });
      
          if (!employee) {
            throw new NotFoundException('Employee not found');
          }
      
          await this.prisma.user.update({
            where: { id: employeeId },
            data: {
              jobRole,
            },
          });
      
          // update balances
          for (const balance of leaveBalances) {
            await this.prisma.leaveBalance.upsert({
              where: {
                userId_type: {
                  userId: employeeId,
                  type: balance.type,
                },
              },
              update: {
                total: balance.total,
              },
              create: {
                userId: employeeId,
                type: balance.type,
                total: balance.total,
                used: 0,
              },
            });
          }
      
          return { message: 'Employee updated successfully' };
        }
      
        // ==========================
        // SOFT DELETE EMPLOYEE
        // ==========================
        async deleteEmployee(employeeId: string) {
          const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
          });
      
          if (!employee) {
            throw new NotFoundException('Employee not found');
          }
      
          await this.prisma.user.update({
            where: { id: employeeId },
            data: {
              isActive: false,
            },
          });
      
          return { message: 'Employee deactivated successfully' };
        }
      }
      