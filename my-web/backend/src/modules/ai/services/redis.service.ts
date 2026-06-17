/**
 * Mục đích: Service quản lý kết nối và các thao tác Redis (caching, distributed lock, rate limiting).
 * File quan hệ: Được sử dụng rộng rãi bởi AiService và các service AI khác.
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { appConfig } from '../../../config/app.config';
import type { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;

  // Local fallbacks
  private readonly memoryCache = new Map<string, string>();
  private readonly memoryLocks = new Map<string, Promise<void>>();
  private readonly memoryRateLimit = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly memoryQueues = new Map<string, string[]>();

  async onModuleInit() {
    const config = appConfig();
    const isProduction = process.env.NODE_ENV === 'production';

    try {
      const ioredis = await import('ioredis');
      const Redis = ioredis.default || ioredis;

      const RedisConstructor = Redis as unknown as {
        new (options: unknown): Redis;
        new (url: string, options: unknown): Redis;
      };

      const connectionOptions: Record<string, unknown> = config.redisUrl
        ? {
            // Dùng URL trực tiếp - ioredis tự parse TLS từ scheme rediss://
            // Đây là cách chuẩn để kết nối Upstash Redis
            lazyConnect: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 5000,
          }
        : {
            host: config.redisHost,
            port: config.redisPort,
            password: config.redisPassword,
            maxRetriesPerRequest: 1,
            connectTimeout: 5000,
          };

      this.redisClient = config.redisUrl
        ? new RedisConstructor(config.redisUrl, connectionOptions)
        : new RedisConstructor(connectionOptions);

      this.redisClient.on('error', (err: Error) => {
        if (this.isRedisAvailable) {
          this.logger.error(`Redis error: ${err.message}`);
          this.isRedisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully.');
        this.isRedisAvailable = true;
      });

      // Simple ping to verify connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection ping timeout.'));
        }, 2000);

        if (!this.redisClient) {
          clearTimeout(timeout);
          reject(new Error('Redis client is null.'));
          return;
        }

        this.redisClient.ping((err: Error | null) => {
          clearTimeout(timeout);
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis connection failed: ${errMsg}`);
      this.isRedisAvailable = false;

      if (isProduction) {
        this.logger.error(
          'CRITICAL: Redis is required in Production environment! Application is shutting down.',
        );
        process.exit(1); // Fail-fast policy on production
      } else {
        this.logger.warn(
          'WARNING: Redis is offline. Running in Development mode with local In-Memory fallback.',
        );
      }
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

  // KEY-VALUE ACTIONS
  async get(key: string): Promise<string | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.get(key);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis GET failed for key: ${key}. Error: ${errMsg}`);
      }
    }
    // Dev Fallback
    return this.memoryCache.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (ttlSeconds) {
          await this.redisClient.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, value);
        }
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis SET failed for key: ${key}. Error: ${errMsg}`);
      }
    }
    // Dev Fallback
    this.memoryCache.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => {
        this.memoryCache.delete(key);
      }, ttlSeconds * 1000);
    }
  }

  async del(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis DEL failed for key: ${key}. Error: ${errMsg}`);
      }
    }
    // Dev Fallback
    this.memoryCache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const stream = this.redisClient.scanStream({
          match: pattern,
          count: 100,
        });

        for await (const resultKeys of stream) {
          if (resultKeys.length > 0) {
            await this.redisClient.del(...resultKeys);
          }
        }
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Redis delPattern failed for: ${pattern}. Error: ${errMsg}`,
        );
      }
    }

    // In-memory fallback
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async ttl(key: string): Promise<number> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.ttl(key);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis TTL failed for key: ${key}. Error: ${errMsg}`);
      }
    }
    return -1;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const count = await this.redisClient.incr(key);
        if (count === 1 && ttlSeconds) {
          await this.redisClient.expire(key, ttlSeconds);
        }
        return count;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis INCR failed for key: ${key}. Error: ${errMsg}`);
      }
    }
    // Dev Fallback
    const attemptsStr = this.memoryCache.get(key);
    let attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    attempts += 1;
    this.memoryCache.set(key, attempts.toString());
    if (attempts === 1 && ttlSeconds) {
      setTimeout(() => {
        this.memoryCache.delete(key);
      }, ttlSeconds * 1000);
    }
    return attempts;
  }

  async incrBy(
    key: string,
    value: number,
    ttlSeconds?: number,
  ): Promise<number> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const count = await this.redisClient.incrby(key, value);
        if (count === value && ttlSeconds) {
          await this.redisClient.expire(key, ttlSeconds);
        }
        return count;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Redis INCRBY failed for key: ${key}. Error: ${errMsg}`,
        );
      }
    }
    // Dev Fallback
    const attemptsStr = this.memoryCache.get(key);
    let attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    attempts += value;
    this.memoryCache.set(key, attempts.toString());
    if (attempts === value && ttlSeconds) {
      setTimeout(() => {
        this.memoryCache.delete(key);
      }, ttlSeconds * 1000);
    }
    return attempts;
  }

  // DISTRIBUTED LOCKS
  async acquireLock(
    lockKey: string,
    ttlMs = 10000,
    maxRetries = 10,
    retryIntervalMs = 150,
  ): Promise<() => Promise<void>> {
    const token = Math.random().toString(36).substring(2);

    const client = this.redisClient;
    if (this.isRedisAvailable && client) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await client.set(lockKey, token, 'PX', ttlMs, 'NX');
          if (result === 'OK') {
            this.logger.debug(`Acquired Redis lock: ${lockKey}`);
            return async () => {
              try {
                const luaScript = `
                  if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                  else
                    return 0
                  end
                `;
                await client.eval(luaScript, 1, lockKey, token);
                this.logger.debug(`Released Redis lock: ${lockKey}`);
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Failed to release Redis lock: ${errMsg}`);
              }
            };
          }
          await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Redis lock acquisition error: ${errMsg}`);
          break;
        }
      }
    }

    // Dev Fallback (In-Memory Mutex Lock)
    let releaseMemory: () => void = () => {};
    const currentPromise = this.memoryLocks.get(lockKey) || Promise.resolve();
    const nextPromise = new Promise<void>((resolve) => {
      releaseMemory = resolve;
    });
    this.memoryLocks.set(lockKey, nextPromise);
    await currentPromise;
    this.logger.debug(`Acquired Memory lock: ${lockKey}`);

    return () => {
      releaseMemory();
      if (this.memoryLocks.get(lockKey) === nextPromise) {
        this.memoryLocks.delete(lockKey);
      }
      this.logger.debug(`Released Memory lock: ${lockKey}`);
      return Promise.resolve();
    };
  }

  // DISTRIBUTED RATE LIMITER
  async isRateLimited(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean> {
    const now = Date.now();

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const pipeline = this.redisClient.multi();
        pipeline.incr(key);
        pipeline.ttl(key);
        const results = await pipeline.exec();

        if (!results) return false;
        // results is an array of [err, val] for each operation
        const count = Number(results[0][1]);
        const ttl = Number(results[1][1]);

        if (count === 1 || ttl === -1) {
          // If first request or key has no TTL, set expiry
          await this.redisClient.pexpire(key, windowMs);
        }

        if (count > limit) {
          return true; // Rate limited
        }
        return false;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis rate limit check failed: ${errMsg}`);
      }
    }

    // Dev Fallback
    const rateData = this.memoryRateLimit.get(key);
    if (!rateData || now > rateData.resetTime) {
      this.memoryRateLimit.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    rateData.count++;
    if (rateData.count > limit) {
      return true; // Rate limited
    }
    return false;
  }

  // QUEUE OPERATIONS (Dead Letter Queue)
  async rpush(key: string, value: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.rpush(key, value);
        return;
      } catch (err) {
        this.logger.warn(
          `Redis RPUSH failed for key: ${key}. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    if (!this.memoryQueues.has(key)) {
      this.memoryQueues.set(key, []);
    }
    this.memoryQueues.get(key)!.push(value);
  }

  async lpop(key: string): Promise<string | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.lpop(key);
      } catch (err) {
        this.logger.warn(
          `Redis LPOP failed for key: ${key}. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    const queue = this.memoryQueues.get(key);
    if (!queue || queue.length === 0) return null;
    return queue.shift() || null;
  }

  async ping(): Promise<boolean> {
    if (!this.isRedisAvailable || !this.redisClient) {
      return false;
    }
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
