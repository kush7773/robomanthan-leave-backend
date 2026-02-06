import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // ===============================
  // EMPLOYEE → APPLY LEAVE
  // ===============================
  @UseGuards(JwtAuthGuard)
  @Post('apply')
  applyLeave(@Req() req, @Body() body) {
    return this.leavesService.applyLeave(
      req.user.userId,
      body.type,
      body.reason,
      new Date(body.fromDate),
      new Date(body.toDate),
    );
  }

  // ===============================
  // EMPLOYER → PENDING LEAVES
  // ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Get('pending')
  getPendingLeaves() {
    return this.leavesService.getPendingLeaves();
  }

  // ===============================
  // EMPLOYER → APPROVE (DASHBOARD)
  // ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Post('approve/:id')
  approveById(@Param('id') id: string, @Req() req) {
    return this.leavesService.approveById(id, req.user.userId);
  }

  // ===============================
  // EMPLOYER → REJECT (DASHBOARD)
  // ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Post('reject/:id')
  rejectById(@Param('id') id: string, @Req() req) {
    return this.leavesService.rejectById(id, req.user.userId);
  }

  // ===============================
  // EMAIL → APPROVE
  // ===============================
  @Get('approve')
  approveByToken(@Query('token') token: string) {
    return this.leavesService.approveByToken(token);
  }

  // ===============================
  // EMAIL → REJECT
  // ===============================
  @Get('reject')
  rejectByToken(@Query('token') token: string) {
    return this.leavesService.rejectByToken(token);
  }

  // ===============================
  // CALENDAR → BY DATE
  // ===============================
  @UseGuards(JwtAuthGuard)
  @Get('by-date')
  getLeavesByDate(@Query('date') date: string) {
    return this.leavesService.getLeavesByDate(new Date(date));
  }

  // ===============================
  // HISTORY
  // ===============================
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getMyHistory(@Req() req) {
    return this.leavesService.getEmployeeHistory(req.user.userId);
  }
}