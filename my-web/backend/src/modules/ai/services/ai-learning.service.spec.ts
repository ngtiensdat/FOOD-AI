import { Test, TestingModule } from '@nestjs/testing';
import { AiLearningService } from './ai-learning.service';
import { PrismaService } from '../../../database/prisma.service';
import { OpenAIService } from './openai.service';
import { VectorRepository } from '../vector.repository';

describe('AiLearningService (AI Memory & Preferences)', () => {
  let service: AiLearningService;
  let prisma: any;
  let openai: any;
  let vectorRepo: any;

  beforeEach(async () => {
    prisma = {
      userProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      aiFeedback: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      favorite: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      history: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    openai = {
      getEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.01)),
    };

    vectorRepo = {
      updateUserEmbedding: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiLearningService,
        { provide: PrismaService, useValue: prisma },
        { provide: OpenAIService, useValue: openai },
        { provide: VectorRepository, useValue: vectorRepo },
      ],
    }).compile();

    service = module.get<AiLearningService>(AiLearningService);
  });

  describe('getUserAiMemory', () => {
    it('nên lấy đúng thông tin ký ức và sở thích của người dùng', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        preferences: {
          allergies: ['tôm', 'cua'],
          dislikes: ['cay'],
          persona: 'GYM',
          specialNotes: 'Ăn thanh đạm',
        },
      });

      const memory = await service.getUserAiMemory(1);
      expect(memory.preferences.allergies).toEqual([
        'Tôm (và giáp xác: bề bề, cua, ghẹ)',
      ]);
      expect(memory.preferences.dislikes).toEqual(['cay']);
      expect(memory.preferences.persona).toBe('GYM');
      expect(memory.preferences.specialNotes).toBe('Ăn thanh đạm');
      expect(memory.likedFoods).toEqual([]);
      expect(memory.dislikedFoods).toEqual([]);
    });

    it('nên trả về mảng rỗng và null an toàn nếu người dùng chưa có sở thích lưu trữ', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      const memory = await service.getUserAiMemory(2);
      expect(memory.preferences.allergies).toEqual([]);
      expect(memory.preferences.dislikes).toEqual([]);
      expect(memory.preferences.persona).toBeNull();
      expect(memory.preferences.specialNotes).toBeNull();
    });
  });

  describe('deleteUserAiMemoryItem', () => {
    it('nên xóa một chất dị ứng cụ thể khỏi danh sách allergies mà không làm mất các dị ứng khác', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        preferences: {
          allergies: ['tôm', 'đậu phộng', 'hải sản'],
          dislikes: ['cay'],
          persona: 'GYM',
        },
      });

      const result = await service.deleteUserAiMemoryItem(
        1,
        'allergy',
        'đậu phộng',
      );
      expect(result.success).toBe(true);
      expect(result.preferences?.allergies).toEqual(['tôm', 'hải sản']);
      expect(result.preferences?.dislikes).toEqual(['cay']);
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          preferences: expect.objectContaining({
            allergies: ['tôm', 'hải sản'],
          }),
        },
      });
    });

    it('nên xóa một món kiêng/dislike cụ thể', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        preferences: {
          allergies: ['tôm'],
          dislikes: ['cay', 'hành lá'],
        },
      });

      const result = await service.deleteUserAiMemoryItem(1, 'dislike', 'cay');
      expect(result.success).toBe(true);
      expect(result.preferences?.dislikes).toEqual(['hành lá']);
    });

    it('nên xóa phong cách persona khi người dùng yêu cầu', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        preferences: {
          allergies: ['tôm'],
          persona: 'PREGNANT',
        },
      });

      const result = await service.deleteUserAiMemoryItem(1, 'persona');
      expect(result.success).toBe(true);
      expect(result.preferences?.persona).toBeUndefined();
    });

    it('nên xóa sạch toàn bộ ký ức khi type = all', async () => {
      const result = await service.deleteUserAiMemoryItem(1, 'all');
      expect(result.success).toBe(true);
      expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { preferences: {} },
      });
      expect(prisma.aiFeedback.deleteMany).toHaveBeenCalled();
    });
  });

  describe('updateUserProfileFacts', () => {
    it('nên hợp nhất thông minh (Set union) các sự thật mới vào profile', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        preferences: {
          allergies: ['tôm'],
          dislikes: ['hành'],
        },
      });

      await service.updateUserProfileFacts(1, {
        allergies: ['đậu phộng'],
        dislikes: ['cay'],
        persona: 'STUDENT',
      });

      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          preferences: {
            allergies: [
              'Tôm (và giáp xác: bề bề, cua, ghẹ)',
              'Đậu phộng (Lạc)',
            ],
            dislikes: ['hành', 'cay'],
            persona: 'STUDENT',
          },
        },
      });
    });
  });
});
