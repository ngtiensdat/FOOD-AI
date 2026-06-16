import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaModule } from '../../database/prisma.module';
import { CommonCacheModule } from '../../common/cache.module';
import { NotificationModule } from '../notification/notification.module';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [PrismaModule, CommonCacheModule, NotificationModule, BadgeModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class SocialModule {}
