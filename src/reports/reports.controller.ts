import {
        Controller,
        Get,
        Query,
        UseGuards,
        Header,
      } from '@nestjs/common';
      import { ReportsService } from './reports.service';
      import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
      import { RolesGuard } from '../common/guards/roles.guard';
      import { Roles } from '../common/decorators/roles.decorator';
      
      @Controller('reports')
      export class ReportsController {
        constructor(private readonly reportsService: ReportsService) {}
      
        // ===============================
        // CSV EXPORT
        // ===============================
        @Get('leaves/export')
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('EMPLOYER')
        @Header('Content-Type', 'text/csv')
        @Header(
          'Content-Disposition',
          'attachment; filename="leave-report.csv"',
        )
        exportCSV(@Query() query: any) {
          return this.reportsService.generateLeaveCSV(query);
        }
      
        // ===============================
        // EXCEL EXPORT
        // ===============================
        @Get('leaves/export-excel')
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('EMPLOYER')
        @Header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        @Header(
          'Content-Disposition',
          'attachment; filename="leave-report.xlsx"',
        )
        exportExcel(@Query() query: any) {
          return this.reportsService.generateLeaveExcel(query);
        }
      }
      