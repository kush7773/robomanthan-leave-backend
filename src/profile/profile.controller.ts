import {
        Controller,
        Get,
        Put,
        Req,
        Body,
        UseGuards,
      } from '@nestjs/common';
      import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
      import { ProfileService } from './profile.service';
      
      @Controller('profile')
      @UseGuards(JwtAuthGuard)
      export class ProfileController {
        constructor(private readonly profileService: ProfileService) {}
      
        // GET employee profile
        @Get()
        getProfile(@Req() req) {
          return this.profileService.getProfile(req.user.userId);
        }
      
        // UPDATE employee profile (email & phone only)
        @Put()
        updateProfile(@Req() req, @Body() body) {
          return this.profileService.updateProfile(
            req.user.userId,
            body.email,
            body.phone,
          );
        }
      }
      