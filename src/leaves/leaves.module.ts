import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module'; // Required for JwtAuthGuard

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}