// Mục đích: Cung cấp Service bọc (CacheService wrapper) đóng gói các thao tác Caching.
// Ý nghĩa: Giúp dễ dàng thực hiện mẫu thiết kế Cache-aside (get -> miss -> fetch -> set) cho toàn bộ backend, hỗ trợ TTL và xóa cache theo pattern (wildcard).
// Thiết kế: Sử dụng Dependency Injection của NestJS để gọi trực tiếp RedisService.

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../modules/ai/services/redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Lấy dữ liệu từ Cache, tự động parse JSON về kiểu mong muốn.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisService.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.warn(
        `Failed to parse cache key "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /**
   * Lưu dữ liệu vào Cache, tự động stringify đối tượng.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      await this.redisService.set(key, serialized, ttlSeconds);
    } catch (err) {
      this.logger.warn(
        `Failed to set cache key "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Xóa một key cụ thể khỏi Cache.
   */
  async del(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  /**
   * Xóa cache theo mẫu (wildcard pattern ví dụ: "foods:*").
   */
  async invalidatePattern(pattern: string): Promise<void> {
    await this.redisService.delPattern(pattern);
  }

  /**
   * Pattern Cache-aside Helper: Tự động hóa việc lấy, nạp và lưu cache.
   */
  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    await this.set(key, freshData, ttlSeconds);
    return freshData;
  }
}
