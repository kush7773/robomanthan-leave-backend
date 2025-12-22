import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ===============================
  // EMPLOYEE DASHBOARD
  // ===============================
  @Get('employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYEE')
  getEmployeeDashboard(@Req() req: any) {
    return this.dashboardService.getEmployeeDashboard(req.user.userId);
  }

  // ===============================
  // EMPLOYER DASHBOARD
  // ===============================
  @Get('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  getEmployerDashboard() {
    return this.dashboardService.getEmployerDashboard();
  }
}
