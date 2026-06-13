// Mục đích: Định nghĩa CacheModule dùng chung cho toàn hệ thống NestJS.
// Ý nghĩa: Khởi tạo CacheService và CacheInvalidationInterceptor, import AiModule để sử dụng RedisService đã xuất khẩu.

import { Module } from '@nestjs/common';
import { AiModule } from '../modules/ai/ai.module';
import { CacheService } from './services/cache.service';
import { CacheInvalidationInterceptor } from './interceptors/cache-invalidation.interceptor';

@Module({
  imports: [AiModule],
  providers: [CacheService, CacheInvalidationInterceptor],
  exports: [CacheService, CacheInvalidationInterceptor],
})
export class CommonCacheModule {}
