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
      
        // APPLY LEAVE (EMPLOYEE)
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
      
        // GET PENDING LEAVES (EMPLOYER)
        @Get('pending')
        getPendingLeaves() {
          return this.leavesService.getPendingLeaves();
        }
      
        // APPROVE LEAVE (EMPLOYER UI)
        @Post('approve/:id')
        approveLeave(@Param('id') id: string) {
          return this.leavesService.approveLeaveById(id, 'EMPLOYER_UI');
        }
      
        // REJECT LEAVE (EMPLOYER UI)
        @Post('reject/:id')
        rejectLeave(@Param('id') id: string) {
          return this.leavesService.rejectLeaveById(id, 'EMPLOYER_UI');
        }
      
        // APPROVE LEAVE (EMAIL LINK)
        @Get('approve')
        approveByEmail(@Query('token') token: string) {
          return this.leavesService.approveLeaveByToken(token);
        }
      
        // REJECT LEAVE (EMAIL LINK)
        @Get('reject')
        rejectByEmail(@Query('token') token: string) {
          return this.leavesService.rejectLeaveByToken(token);
        }
      
        // CALENDAR — LEAVES BY DATE
        @Get('by-date')
        getLeavesByDate(@Query('date') date: string) {
          return this.leavesService.getLeavesByDate(date);
        }
      }
      