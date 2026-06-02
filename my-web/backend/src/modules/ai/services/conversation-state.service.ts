/**
 * Mục đích file này để làm gì: Quản lý trạng thái cuộc hội thoại và phân phối khóa (lock) để tránh race condition khi xử lý tin nhắn chat từ người dùng.
 * Các file khác hay file này có ý nghĩa như nào: Được gọi bởi AiService để đồng bộ trạng thái hội thoại và khóa truy cập dữ liệu.
 * Các chức năng đặc biệt: Tự động dùng Redis distributed lock, nếu Redis lỗi thì tự động fallback về In-memory Mutex Lock.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Mutex Lock, Fallback pattern, Singleton.
 * Các biến, hàm đặc biệt trong file: acquireLock(), getConversationMetadata(), updateConversationMetadata().
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { appConfig } from '../../../config/app.config';
import { DialogueState } from '../interfaces/dialogue-state.interface';

@Injectable()
export class ConversationStateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConversationStateService.name);
  private redisClient: any = null;
  private isRedisAvailable = false;
  private readonly memoryLocks = new Map<number, Promise<void>>();

  constructor(
    // eslint-disable-next-line unused-imports/no-unused-vars
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const config = appConfig();
    try {
      const ioredis = await import('ioredis');
      const Redis = ioredis.default || ioredis;
      this.redisClient = new (Redis as any)({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      this.redisClient.on('error', (err: any) => {
        if (this.isRedisAvailable) {
          this.logger.warn(
            `Redis distributed lock error: ${err.message}. Using memory locks.`,
          );
          this.isRedisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully for Distributed Locks.');
        this.isRedisAvailable = true;
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to initialize Redis distributed locks. Using memory locks. Error: ${err.message}`,
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

  // Khóa phân tán sử dụng Redis SET NX PX với timeout, auto release, retry và memory fallback
  async acquireLock(conversationId: number): Promise<() => Promise<void>> {
    const lockKey = `lock:conversation:${conversationId}`;
    const token = Math.random().toString(36).substring(2);
    const ttlMs = 10000; // Khóa tự động giải phóng sau 10 giây tránh treo hệ thống
    const maxRetries = 10;
    const retryIntervalMs = 150;

    if (this.isRedisAvailable && this.redisClient) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.redisClient.set(
            lockKey,
            token,
            'NX',
            'PX',
            ttlMs,
          );
          if (result === 'OK') {
            this.logger.debug(
              `Acquired Redis lock: ${lockKey} (Attempt ${attempt})`,
            );
            return async () => {
              try {
                // Giải phóng khóa an toàn bằng Lua script (chỉ xóa key nếu đúng token ban đầu)
                const luaScript = `
                  if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                  else
                    return 0
                  end
                `;
                await this.redisClient.eval(luaScript, 1, lockKey, token);
                this.logger.debug(`Released Redis lock: ${lockKey}`);
              } catch (err: any) {
                this.logger.warn(
                  `Failed to release Redis lock: ${err.message}`,
                );
              }
            };
          }
          await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
        } catch (err: any) {
          this.logger.warn(
            `Redis lock error: ${err.message}. Falling back to memory lock.`,
          );
          this.isRedisAvailable = false;
          break;
        }
      }
      this.logger.warn(
        `Redis lock acquisition timed out for conversation: ${conversationId}. Falling back to memory lock.`,
      );
    }

    // In-memory Mutex Fallback
    let releaseMemory: () => void = () => {};
    const currentPromise =
      this.memoryLocks.get(conversationId) || Promise.resolve();
    const nextPromise = new Promise<void>((resolve) => {
      releaseMemory = resolve;
    });
    this.memoryLocks.set(conversationId, nextPromise);
    await currentPromise;
    this.logger.debug(
      `Acquired Memory lock for conversation: ${conversationId}`,
    );

    return () => {
      releaseMemory();
      if (this.memoryLocks.get(conversationId) === nextPromise) {
        this.memoryLocks.delete(conversationId);
      }
      this.logger.debug(
        `Released Memory lock for conversation: ${conversationId}`,
      );
      return Promise.resolve();
    };
  }

  async getConversationMetadata(
    conversationId: number,
  ): Promise<DialogueState> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { metadata: true },
    });
    return (
      (conversation?.metadata as any) || {
        slots: {},
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      }
    );
  }

  async updateConversationMetadata(
    conversationId: number,
    metadata: DialogueState,
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { metadata: metadata as any },
    });
  }
}
