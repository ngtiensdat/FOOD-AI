// Mục đích: Định nghĩa CacheInvalidationInterceptor để tự động xử lý việc xóa cache dựa trên siêu dữ liệu (metadata) của decorator.
// Ý nghĩa: Khi phương thức hoàn thành thành công, interceptor sẽ lấy pattern từ decorator và gọi CacheService để xóa toàn bộ cache khớp với pattern đó.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHE_INVALIDATE_METADATA_KEY } from '../decorators/invalidate-cache.decorator';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const pattern = this.reflector.getAllAndOverride<string>(
      CACHE_INVALIDATE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!pattern) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void (async () => {
          try {
            await this.cacheService.invalidatePattern(pattern);
          } catch (err) {
            // Bỏ qua lỗi để không ảnh hưởng đến API chính
          }
        })();
      }),
    );
  }
}
