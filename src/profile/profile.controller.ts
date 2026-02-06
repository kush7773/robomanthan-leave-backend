import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get()
  getProfile(@Req() req) {
    return this.service.getProfile(req.user.userId);
  }

  @Put()
  updateProfile(
    @Req() req,
    @Body() body: { email?: string; phone?: string },
  ) {
    return this.service.updateProfile(req.user.userId, body);
  }
}