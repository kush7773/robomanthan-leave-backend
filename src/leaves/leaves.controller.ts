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
      
      @Controller('leaves')
      @UseGuards(JwtAuthGuard)
      export class LeavesController {
        constructor(private readonly leavesService: LeavesService) {}
      
        // EMPLOYEE – APPLY LEAVE
        @Post('apply')
        applyLeave(@Req() req, @Body() body) {
          return this.leavesService.applyLeave(
            req.user.userId,
            body.type,
            body.reason,
            body.fromDate,
            body.toDate,
          );
        }
      
        // EMPLOYEE – LEAVE HISTORY
        @Get('history')
        getEmployeeHistory(@Req() req) {
          return this.leavesService.getEmployeeLeaveHistory(
            req.user.userId,
          );
        }
      
        // EMPLOYER – PENDING LEAVES
        @Get('pending')
        getPendingLeaves() {
          return this.leavesService.getPendingLeaves();
        }
      
        // EMPLOYER – APPROVE (UI)
        @Post('approve/:id')
        approveLeave(@Param('id') id: string) {
          return this.leavesService.approveLeaveById(id);
        }
      
        // EMPLOYER – REJECT (UI)
        @Post('reject/:id')
        rejectLeave(@Param('id') id: string) {
          return this.leavesService.rejectLeaveById(id);
        }
      
        // APPROVE VIA EMAIL
        @Get('approve')
        approveByEmail(@Query('token') token: string) {
          return this.leavesService.approveLeaveByToken(token);
        }
      
        // REJECT VIA EMAIL
        @Get('reject')
        rejectByEmail(@Query('token') token: string) {
          return this.leavesService.rejectLeaveByToken(token);
        }
      
        // EMPLOYER – CALENDAR VIEW
        @Get('by-date')
        getLeavesByDate(@Query('date') date: string) {
          return this.leavesService.getLeavesByDate(date);
        }
      
        // EMPLOYER – FULL LEAVE HISTORY
        @Get('history/all')
        getAllLeaveHistory() {
          return this.leavesService.getAllLeaveHistory();
        }
      }
      