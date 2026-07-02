/**
 * Mục đích: Service quản lý bộ nhớ đệm (caching) các vector embedding bằng Redis để tối ưu hóa hiệu năng.
 * File quan hệ: Được sử dụng khi truy vấn tương đồng món ăn.
 */

import { Injectable, Logger } from '@nestjs/common';
import { appConfig } from '../../../config/app.config';
import * as crypto from 'crypto';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class EmbeddingCacheService {
  private readonly logger = new Logger(EmbeddingCacheService.name);

  constructor(private readonly redisService: RedisService) {}

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
    const cached = await this.redisService.get(key);
    if (cached) {
      this.logger.log(`Embedding cache HIT for key: ${key}`);
      try {
        return JSON.parse(cached) as number[];
      } catch (_err) {
        return null;
      }
    }
    this.logger.log(`Embedding cache MISS for key: ${key}`);
    return null;
  }

  async set(text: string, embedding: number[]): Promise<void> {
    const key = this.getCacheKey(text);
    const config = appConfig();
    await this.redisService.set(
      key,
      JSON.stringify(embedding),
      config.redisTtl,
    );
  }
}
