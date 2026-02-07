import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) { }

  // ==========================
  // EMPLOYEE – APPLY LEAVE
  // ==========================
  @Post('apply')
  applyLeave(@Req() req, @Body() body: ApplyLeaveDto) {
    // FIX: Pass strings directly. Do NOT use new Date() here.
    return this.leavesService.applyLeave(
      req.user.userId,
      body.type,
      body.reason,
      body.fromDate,
      body.toDate,
    );
  }

  // ==========================
  // EMPLOYEE – LEAVE HISTORY
  // ==========================
  @Get('history')
  getEmployeeHistory(@Req() req) {
    // FIX: Correct method name is 'getEmployeeLeaveHistory'
    return this.leavesService.getEmployeeLeaveHistory(
      req.user.userId,
    );
  }

  // ==========================
  // EMPLOYER – PENDING LEAVES
  // ==========================
  @Get('pending')
  getPendingLeaves() {
    return this.leavesService.getPendingLeaves();
  }

  // ==========================
  // EMPLOYER – APPROVE (UI)
  // ==========================
  @Post(':id/approve')
  approveLeave(@Param('id') id: string) {
    // FIX: Correct method name is 'approveLeaveById'
    // FIX: Removed extra argument (Service only takes ID)
    return this.leavesService.approveLeaveById(id);
  }

  // ==========================
  // EMPLOYER – REJECT (UI)
  // ==========================
  @Post(':id/reject')
  rejectLeave(@Param('id') id: string) {
    // FIX: Correct method name is 'rejectLeaveById'
    return this.leavesService.rejectLeaveById(id);
  }

  // ==========================
  // APPROVE VIA EMAIL
  // ==========================
  @Public()
  @Get('approve')
  approveByEmail(@Query('token') token: string) {
    // FIX: Correct method name is 'approveLeaveByToken'
    return this.leavesService.approveLeaveByToken(token);
  }

  // ==========================
  // REJECT VIA EMAIL
  // ==========================
  @Public()
  @Get('reject')
  rejectByEmail(@Query('token') token: string) {
    // FIX: Correct method name is 'rejectLeaveByToken'
    return this.leavesService.rejectLeaveByToken(token);
  }

  // ==========================
  // EMPLOYER – CALENDAR VIEW
  // ==========================
  @Get('by-date')
  getLeavesByDate(@Query('date') date: string) {
    // FIX: Pass string directly. Service handles conversion.
    return this.leavesService.getLeavesByDate(date);
  }

  // ==========================
  // EMPLOYER – FULL LEAVE HISTORY
  // ==========================
  @Get('history/all')
  getAllLeaveHistory() {
    return this.leavesService.getAllLeaveHistory();
  }
}