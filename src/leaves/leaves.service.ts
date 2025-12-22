import {
        Injectable,
        BadRequestException,
        NotFoundException,
      } from '@nestjs/common';
      import { PrismaService } from '../prisma/prisma.service';
      import { MailService } from '../mail/mail.service';
      import { LeaveStatus } from '@prisma/client';
      import { randomUUID } from 'crypto';
      
      @Injectable()
      export class LeavesService {
        constructor(
          private readonly prisma: PrismaService,
          private readonly mailService: MailService,
        ) {}
      
        // ==========================
        // APPLY LEAVE (EMPLOYEE)
        // ==========================
        async applyLeave(
          userId: string,
          type: string,
          reason: string,
          fromDate: string,
          toDate: string,
        ) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });
      
          if (!user || !user.isActive) {
            throw new BadRequestException('Employee not found');
          }
      
          const approvalToken = randomUUID();
      
          const leave = await this.prisma.leave.create({
            data: {
              userId,
              type,
              reason,
              fromDate: new Date(fromDate),
              toDate: new Date(toDate),
              status: LeaveStatus.PENDING,
              approvalToken,
            },
            include: {
              user: true,
            },
          });
      
          // Email to HR / Manager
          await this.mailService.sendLeaveRequestToApprover({
            employeeName: leave.user.name,
            employeeEmail: leave.user.email,
            type: leave.type,
            reason: leave.reason,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            approvalToken,
          });
      
          return { message: 'Leave request submitted for approval' };
        }
      
        // ==========================
        // GET PENDING LEAVES (EMPLOYER)
        // ==========================
        async getPendingLeaves() {
          return this.prisma.leave.findMany({
            where: {
              status: LeaveStatus.PENDING,
              user: {
                isActive: true,
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  jobRole: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });
        }
      
        // ==========================
        // APPROVE LEAVE (EMPLOYER UI)
        // ==========================
        async approveLeaveById(leaveId: string, decidedBy: string) {
          const leave = await this.prisma.leave.findUnique({
            where: { id: leaveId },
            include: { user: true },
          });
      
          if (!leave || leave.status !== LeaveStatus.PENDING) {
            throw new NotFoundException('Leave not found or already decided');
          }
      
          await this.prisma.leave.update({
            where: { id: leaveId },
            data: {
              status: LeaveStatus.APPROVED,
              decidedBy,
              approvalToken: null,
            },
          });
      
          await this.mailService.sendLeaveDecisionToEmployee({
            email: leave.user.email,
            name: leave.user.name,
            status: 'APPROVED',
          });
      
          return { message: 'Leave approved successfully' };
        }
      
        // ==========================
        // REJECT LEAVE (EMPLOYER UI)
        // ==========================
        async rejectLeaveById(leaveId: string, decidedBy: string) {
          const leave = await this.prisma.leave.findUnique({
            where: { id: leaveId },
            include: { user: true },
          });
      
          if (!leave || leave.status !== LeaveStatus.PENDING) {
            throw new NotFoundException('Leave not found or already decided');
          }
      
          await this.prisma.leave.update({
            where: { id: leaveId },
            data: {
              status: LeaveStatus.REJECTED,
              decidedBy,
              approvalToken: null,
            },
          });
      
          await this.mailService.sendLeaveDecisionToEmployee({
            email: leave.user.email,
            name: leave.user.name,
            status: 'REJECTED',
          });
      
          return { message: 'Leave rejected successfully' };
        }
      
        // ==========================
        // APPROVE LEAVE (EMAIL LINK)
        // ==========================
        async approveLeaveByToken(token: string) {
          const leave = await this.prisma.leave.findUnique({
            where: { approvalToken: token },
            include: { user: true },
          });
      
          if (!leave) {
            throw new NotFoundException('Invalid or expired token');
          }
      
          await this.prisma.leave.update({
            where: { id: leave.id },
            data: {
              status: LeaveStatus.APPROVED,
              decidedBy: 'EMAIL',
              approvalToken: null,
            },
          });
      
          await this.mailService.sendLeaveDecisionToEmployee({
            email: leave.user.email,
            name: leave.user.name,
            status: 'APPROVED',
          });
      
          return { message: 'Leave approved successfully' };
        }
      
        // ==========================
        // REJECT LEAVE (EMAIL LINK)
        // ==========================
        async rejectLeaveByToken(token: string) {
          const leave = await this.prisma.leave.findUnique({
            where: { approvalToken: token },
            include: { user: true },
          });
      
          if (!leave) {
            throw new NotFoundException('Invalid or expired token');
          }
      
          await this.prisma.leave.update({
            where: { id: leave.id },
            data: {
              status: LeaveStatus.REJECTED,
              decidedBy: 'EMAIL',
              approvalToken: null,
            },
          });
      
          await this.mailService.sendLeaveDecisionToEmployee({
            email: leave.user.email,
            name: leave.user.name,
            status: 'REJECTED',
          });
      
          return { message: 'Leave rejected successfully' };
        }
      
        // ==========================
        // CALENDAR VIEW — LEAVES BY DATE
        // ==========================
        async getLeavesByDate(date: string) {
          const selectedDate = new Date(date);
      
          return this.prisma.leave.findMany({
            where: {
              status: LeaveStatus.APPROVED,
              fromDate: { lte: selectedDate },
              toDate: { gte: selectedDate },
              user: {
                isActive: true,
              },
            },
            select: {
              id: true,
              type: true,
              reason: true,
              fromDate: true,
              toDate: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  jobRole: true,
                },
              },
            },
            orderBy: {
              fromDate: 'asc',
            },
          });
        }
      }
      