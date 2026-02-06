import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ======================
  // LOGIN
  // ======================
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    return this.authService.login(email, password);
  }

  // ======================
  // FORGOT PASSWORD
  // ======================
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: { email: string },
  ) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.authService.forgotPassword(email);
  }

  // ======================
  // RESET PASSWORD
  // ======================
  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      token: string;
      newPassword: string;
    },
  ) {
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      throw new BadRequestException(
        'Token and new password are required',
      );
    }

    return this.authService.resetPassword(token, newPassword);
  }
}