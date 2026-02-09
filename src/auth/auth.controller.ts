import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) { // <--- 2. USE IT HERE
    // We confirm the data exists, then normalize email
    return this.authService.login(
      loginDto.email.toLowerCase(),
      loginDto.password
    );
  }

  // ... keep your other methods (forgotPassword, etc) ...
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('change-password')
  changePassword(@Req() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }
}