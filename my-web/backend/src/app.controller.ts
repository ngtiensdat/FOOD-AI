import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { AiService } from './modules/ai/ai.service';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './modules/ai/services/redis.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }
    try {
      const isRedisHealthy = await this.redisService.ping();
      if (!isRedisHealthy) {
        redisStatus = 'error';
      }
    } catch {
      redisStatus = 'error';
    }

    return {
      status:
        dbStatus === 'ok' && redisStatus === 'ok' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  }

  @Get('health/live')
  liveCheck() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('health/ready')
  async readyCheck(@Res({ passthrough: true }) res: Response) {
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }
    try {
      const isRedisHealthy = await this.redisService.ping();
      if (!isRedisHealthy) {
        redisStatus = 'error';
      }
    } catch {
      redisStatus = 'error';
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isHealthy =
      dbStatus === 'ok' && (redisStatus === 'ok' || !isProduction);

    if (!isHealthy) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isHealthy ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  @Get('test-ai')
  async testAi(@Query('text') text: string) {
    const embedding = await this.aiService.getEmbedding(
      text || 'Cơm tấm Sài Gòn',
    );
    return {
      text: text || 'Cơm tấm Sài Gòn',
      vectorLength: embedding.length,
      firstTenValues: embedding.slice(0, 10),
    };
  }
}
