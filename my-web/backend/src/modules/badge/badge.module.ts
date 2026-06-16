import { Module } from '@nestjs/common';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { GamificationQueueService } from './gamification-queue.service';
import { GamificationConfigController } from './gamification-config.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [BadgeController, GamificationConfigController],
  providers: [BadgeService, GamificationQueueService],
  exports: [BadgeService, GamificationQueueService],
})
export class BadgeModule {}
