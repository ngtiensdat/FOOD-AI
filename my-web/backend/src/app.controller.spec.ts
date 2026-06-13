import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiService } from './modules/ai/ai.service';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './modules/ai/services/redis.service';
import { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AiService,
          useValue: {
            getEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0)),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get<PrismaService>(PrismaService);
    redisService = app.get<RedisService>(RedisService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when database and redis are online', async () => {
      const res = await appController.healthCheck();
      expect(res.status).toBe('healthy');
      expect(res.services.database).toBe('ok');
      expect(res.services.redis).toBe('ok');
    });

    it('should return unhealthy when database fails', async () => {
      jest
        .spyOn(prismaService, '$queryRaw')
        .mockRejectedValueOnce(new Error('Connection error'));
      const res = await appController.healthCheck();
      expect(res.status).toBe('unhealthy');
      expect(res.services.database).toBe('error');
      expect(res.services.redis).toBe('ok');
    });

    it('should return unhealthy when redis fails', async () => {
      jest.spyOn(redisService, 'ping').mockResolvedValueOnce(false);
      const res = await appController.healthCheck();
      expect(res.status).toBe('unhealthy');
      expect(res.services.database).toBe('ok');
      expect(res.services.redis).toBe('error');
    });
  });

  describe('liveCheck', () => {
    it('should return live status', () => {
      const res = appController.liveCheck();
      expect(res.status).toBe('live');
      expect(res.timestamp).toBeDefined();
      expect(res.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('readyCheck', () => {
    it('should return ready when healthy', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const res = await appController.readyCheck(mockResponse);
      expect(res.status).toBe('ready');
      expect(res.services.database).toBe('ok');
      expect(res.services.redis).toBe('ok');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return unhealthy and set status 503 when db fails in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        jest
          .spyOn(prismaService, '$queryRaw')
          .mockRejectedValueOnce(new Error('Connection error'));
        const mockResponse = {
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const res = await appController.readyCheck(mockResponse);
        expect(res.status).toBe('unhealthy');
        expect(res.services.database).toBe('error');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockResponse.status).toHaveBeenCalledWith(503);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should return unhealthy and set status 503 when redis fails in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        jest.spyOn(redisService, 'ping').mockResolvedValueOnce(false);
        const mockResponse = {
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const res = await appController.readyCheck(mockResponse);
        expect(res.status).toBe('unhealthy');
        expect(res.services.redis).toBe('error');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockResponse.status).toHaveBeenCalledWith(503);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
