import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private service: DashboardService) { }

  @Get('employer')
  @Roles('EMPLOYER')
  employerDashboard() {
    return this.service.getEmployerDashboard();
  }

  @Get('employee')
  @Roles('EMPLOYEE')
  employeeDashboard(@Req() req) {
    return this.service.getEmployeeDashboard(req.user.userId);
  }
}