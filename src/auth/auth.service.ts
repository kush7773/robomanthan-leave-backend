import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ==========================
  // LOGIN (BLOCK INACTIVE USERS)
  // ==========================
  async login(email: string, password: string) {
    console.log(`Login Attempt for: ${email}`); // DEBUG LOG

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('Login Failed: User not found in DB'); // DEBUG LOG
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔒 BLOCK SOFT-DELETED USERS
    if (!user.isActive) {
      console.log('Login Failed: User is inactive'); // DEBUG LOG
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact HR.',
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatch) {
      console.log('Login Failed: Password hash mismatch'); // DEBUG LOG
      // IMPORTANT: If you see this log, your DB password is NOT hashed correctly
      // or you are comparing plain text vs plain text.
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Login Successful'); // DEBUG LOG

    return {
      accessToken: this.jwtService.sign({
        userId: user.id,  // ✅ Changed from 'sub' to 'userId' to match jwt.strategy.ts
        role: user.role,
        email: user.email,
      }),
      role: user.role,
    };
  }

  // ... (Keep the rest of your existing methods: forgotPassword, resetPassword, etc.)
  // Just Copy/Paste the rest of your original file here
  
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Prevent email enumeration
    if (!user || !user.isActive) {
      return { message: 'If the email exists, a reset link was sent' };
    }

    const token = randomUUID();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetLink(
      user.email,
      resetLink,
    );

    return { message: 'Password reset link sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    this.validatePassword(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { message: 'Password reset successful' };
  }

  private validatePassword(password: string) {
    const strong =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strong) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, number & symbol',
      );
    }
  }
}