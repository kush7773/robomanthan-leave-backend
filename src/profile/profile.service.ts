import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // VIEW PROFILE (READ-ONLY JOB ROLE & LEAVES)
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        jobRole: true, // read-only
        leaveBalances: {
          select: {
            type: true,
            total: true,
            used: true,
          },
        },
      },
    });
  }

  // UPDATE PROFILE (ONLY EMAIL & PHONE)
  async updateProfile(
    userId: string,
    email?: string,
    phone?: string,
  ) {
    if (!email && !phone) {
      throw new BadRequestException('Nothing to update');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email,
        phone,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        jobRole: true,
      },
    });
  }
}
