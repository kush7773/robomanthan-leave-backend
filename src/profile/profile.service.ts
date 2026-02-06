import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        jobRole: true,
      },
    });
  }

  updateProfile(userId: string, data: { email?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}