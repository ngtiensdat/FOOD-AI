import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { appConfig } from '../../config/app.config';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  async connectToRedis(): Promise<void> {
    const config = appConfig();

    // Nếu không có REDIS_URL, fallback về in-memory (cho dev/local)
    if (!config.redisUrl) {
      this.logger.warn(
        'No REDIS_URL provided. Falling back to default in-memory adapter for WebSockets.',
      );
      return;
    }

    try {
      const pubClient = new Redis(config.redisUrl, {
        retryStrategy: () => null, // Vô hiệu hóa retry liên tục nếu không có server
      });
      const subClient = pubClient.duplicate();

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          pubClient.on('ready', resolve);
          pubClient.on('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          subClient.on('ready', resolve);
          subClient.on('error', reject);
        }),
      ]);

      this.logger.log(`Connected to Redis for Socket.IO Adapter`);
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (error: any) {
      this.logger.error(
        `Redis connection failed: ${error.message}. Falling back to in-memory adapter.`,
      );
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
