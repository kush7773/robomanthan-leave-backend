import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // =========================
  // APPLY LEAVE
  // =========================
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

  // =========================
  // EMPLOYEE LEAVE HISTORY
  // =========================
  @Get('my')
  getMyLeaves(@Req() req) {
    return this.leavesService.getEmployeeLeaveHistory(req.user.userId);
  }

  // =========================
  // PENDING LEAVES
  // =========================
  @Get('pending')
  getPendingLeaves() {
    return this.leavesService.getPendingLeaves();
  }

  // =========================
  // APPROVE / REJECT (UI)
  // =========================
  @Post('approve/:id')
  approve(@Param('id') id: string) {
    return this.leavesService.approveLeaveById(id);
  }

  @Post('reject/:id')
  reject(@Param('id') id: string) {
    return this.leavesService.rejectLeaveById(id);
  }

  // =========================
  // APPROVE / REJECT (EMAIL)
  // =========================
  @Get('approve')
  approveByToken(@Query('token') token: string) {
    return this.leavesService.approveLeaveByToken(token);
  }

  @Get('reject')
  rejectByToken(@Query('token') token: string) {
    return this.leavesService.rejectLeaveByToken(token);
  }
}