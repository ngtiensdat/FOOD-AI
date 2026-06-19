/**
 * @fileoverview backend/src/modules/media/media.module.ts
 * @description Module đăng ký MediaController và MediaService.
 */

import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
