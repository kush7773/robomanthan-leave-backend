import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';

import { EmployeesModule } from './employees/employees.module';
import { LeavesModule } from './leaves/leaves.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // 🔐 Rate limiting (global)
    ThrottlerModule.forRoot([
      {
      ttl: 60,
      limit: 5, // max 5 requests per minute per IP
      },
  ]),

    // 🧱 Core modules
    PrismaModule,
    MailModule,

    // 🔑 Auth (login + forgot/reset password)
    AuthModule,

    // 👥 Business modules
    EmployeesModule,
    LeavesModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}
