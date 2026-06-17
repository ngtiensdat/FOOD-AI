jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((val) => val),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { OpenAIService } from './../src/modules/ai/services/openai.service';
import { WeatherService } from './../src/modules/ai/services/weather.service';
import { RedisService } from './../src/modules/ai/services/redis.service';
import { PrismaService } from './../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { BcryptHelper } from '../src/common/utils/bcrypt.helper';

describe('AI Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OpenAIService)
      .useValue({
        getEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0)),
        chatCompletion: jest.fn().mockResolvedValue(
          JSON.stringify({
            reply: 'Đây là gợi ý món cơm tấm của AI.',
            intent: 'find_food',
            suggestions: ['Cơm tấm Ba Ghiền', 'Cơm tấm Thuận Kiều'],
          }),
        ),
      })
      .overrideProvider(WeatherService)
      .useValue({
        getCurrentWeather: jest.fn().mockResolvedValue({
          temp: 30,
          condition: 'Nắng',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    redisService = app.get<RedisService>(RedisService);

    // Mock rate limiting to avoid hitting limit between consecutive requests
    jest.spyOn(redisService, 'isRateLimited').mockResolvedValue(false);

    // Tạo test user (CUSTOMER)
    const email = `e2e-ai-${Date.now()}@example.com`;
    const passwordHash = await BcryptHelper.hash('Password123!', 10);
    testUser = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: 'AI Test Customer',
        role: UserRole.CUSTOMER,
        status: UserStatus.APPROVED,
      },
    });

    const payload = {
      sub: testUser.id,
      email: testUser.email,
      role: testUser.role,
    };
    accessToken = jwtService.sign(payload);
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.message.deleteMany({
        where: {
          conversation: {
            userId: testUser.id,
          },
        },
      });
      await prisma.conversation.deleteMany({
        where: {
          userId: testUser.id,
        },
      });
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await app.close();
  });

  describe('AI Chat & Conversations Flow', () => {
    let conversationId: number;

    it('should create a new conversation (POST /ai/conversations)', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      conversationId = response.body.id;
    });

    it('should retrieve conversations (GET /ai/conversations)', async () => {
      const response = await request(app.getHttpServer())
        .get('/ai/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe(conversationId);
    });

    it('should process simple greeting message with local fallback (POST /ai/chat)', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          message: 'xin chào',
          conversationId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('reply');
      expect(response.body.reply).toContain(
        'Xin chào! Tôi là AI tư vấn ẩm thực',
      );
    });

    it('should process user query with mocked OpenAI chatCompletion (POST /ai/chat)', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/chat')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          message: 'Tôi muốn tìm quán cơm tấm ngon',
          conversationId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('reply');
      expect(response.body.reply).toBe('Đây là gợi ý món cơm tấm của AI.');
    });

    it('should get conversation details (GET /ai/conversations/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ai/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(conversationId);
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);
    });

    it('should retrieve and clear chat context (GET /ai/context & DELETE /ai/context)', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/ai/context')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(getRes.body).toHaveProperty('metadata');
      expect(getRes.body.metadata).toHaveProperty('slots');

      await request(app.getHttpServer())
        .delete('/ai/context')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should delete a conversation (DELETE /ai/conversations/:id)', async () => {
      await request(app.getHttpServer())
        .delete(`/ai/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/ai/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const found = listRes.body.find((c: any) => c.id === conversationId);
      expect(found).toBeUndefined();
    });
  });
});
