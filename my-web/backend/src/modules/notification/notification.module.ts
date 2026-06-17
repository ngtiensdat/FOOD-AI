// Mục đích: Khai báo Module hệ thống thông báo (NotificationModule) liên kết Controller, Service, Repository và Gateway.
// File quan hệ: Cấu hình và export NotificationService, NotificationGateway để các module khác sử dụng.

import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationRepository } from './notification.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationRepository],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
