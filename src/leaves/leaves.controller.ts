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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // ✅ EMPLOYEE APPLY LEAVE
  @Post('apply')
  apply(@Req() req, @Body() body) {
    return this.leavesService.applyLeave(req.user.userId, body);
  }

  // ✅ EMPLOYEE LEAVE HISTORY
  @Get('my')
  myLeaves(@Req() req) {
    return this.leavesService.getEmployeeLeaveHistory(req.user.userId);
  }

  // ✅ EMPLOYER: PENDING LEAVES
  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('EMPLOYER')
  pending() {
    return this.leavesService.getPendingLeaves();
  }

  // ✅ EMPLOYER APPROVE
  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('EMPLOYER')
  approve(@Param('id') id: string) {
    return this.leavesService.approveLeaveById(id);
  }

  // ✅ EMPLOYER REJECT
  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('EMPLOYER')
  reject(@Param('id') id: string) {
    return this.leavesService.rejectLeaveById(id);
  }

  // ✅ CALENDAR VIEW
  @Get('by-date')
  @UseGuards(RolesGuard)
  @Roles('EMPLOYER')
  byDate(@Query('date') date: string) {
    return this.leavesService.getLeavesByDate(date);
  }
}
