/**
 * Mục đích file này để làm gì: Cache embedding vector bằng Redis (ưu tiên) hoặc In-memory Map (fallback) để giảm số lần gọi OpenAI Embedding API.
 * Các file khác hay file này có ý nghĩa như nào: Được gọi bởi OpenAIService để kiểm tra và lưu cache embedding trước khi gọi API.
 * Các chức năng đặc biệt: Tự động chuyển đổi giữa Redis và In-memory cache khi Redis bị lỗi kết nối.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Cache-aside pattern, Fallback pattern, Graceful degradation.
 * Các biến, hàm đặc biệt trong file: get(), set(), hashText(), getCacheKey().
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { appConfig } from '../../../config/app.config';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingCacheService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisClient: any = null;
  private isRedisAvailable = false;
  private readonly memoryCache = new Map<string, number[]>();

  async onModuleInit() {
    const config = appConfig();
    try {
      // Lazy load ioredis to prevent compile/load errors if the package is missing
      const ioredis = await import('ioredis');
      const Redis = ioredis.default || ioredis;
      this.redisClient = new (Redis as any)({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        maxRetriesPerRequest: 1, // Fail fast for fallback
        connectTimeout: 2000,
      });

      this.redisClient.on('error', (err: any) => {
        if (this.isRedisAvailable) {
          this.logger.warn(
            `Redis connection error, falling back to memory cache: ${err.message}`,
          );
          this.isRedisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully for Embedding Cache.');
        this.isRedisAvailable = true;
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to initialize Redis client for Embedding Cache. Using memory cache. Error: ${err.message}`,
      );
      this.isRedisAvailable = false;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (_err) {
        // Ignored
      }
    }
  }

  private hashText(text: string): string {
    const normalized = text.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  private getCacheKey(text: string): string {
    const hash = this.hashText(text);
    return `embedding:v2:${hash}`;
  }

  async get(text: string): Promise<number[] | null> {
    const key = this.getCacheKey(text);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) {
          this.logger.log(`Cache HIT (Redis) for key: ${key}`);
          return JSON.parse(cached) as number[];
        }
        this.logger.log(`Cache MISS (Redis) for key: ${key}`);
      } catch (err: any) {
        this.logger.warn(
          `Error reading from Redis cache: ${err.message}. Falling back to memory cache.`,
        );
        this.isRedisAvailable = false;
      }
    }

    // In-memory fallback
    const normalized = text.toLowerCase().trim();
    if (this.memoryCache.has(normalized)) {
      this.logger.log(`Cache HIT (Memory) for text: ${normalized}`);
      return this.memoryCache.get(normalized) || null;
    }
    this.logger.log(`Cache MISS (Memory) for text: ${normalized}`);
    return null;
  }

  async set(text: string, embedding: number[]): Promise<void> {
    const key = this.getCacheKey(text);
    const config = appConfig();

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set(
          key,
          JSON.stringify(embedding),
          'EX',
          config.redisTtl,
        );
        return;
      } catch (err: any) {
        this.logger.warn(`Error writing to Redis cache: ${err.message}`);
        this.isRedisAvailable = false;
      }
    }

    // In-memory fallback
    const normalized = text.toLowerCase().trim();
    this.memoryCache.set(normalized, embedding);
  }
}
