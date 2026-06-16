import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';
import { Favorite, History, UserProfile } from '@prisma/client';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  describe('buildUserPrefContext (Xây dựng Ngữ cảnh Sở thích)', () => {
    it('nên trả về chuỗi trống nếu không có thông tin sở thích lịch sử', () => {
      const result = service.buildUserPrefContext(null, [], []);
      expect(result).toBe('');
    });

    it('nên format đúng các preferences, yêu thích và lịch sử xem của người dùng', () => {
      const profile = {
        userId: 1,
        preferences: {
          goal: 'weight_loss',
          cuisine: 'Món Việt',
          budget: 'Dưới 100k',
        },
      } as unknown as UserProfile;

      const favorites = [
        { food: { name: 'Bún chả' } },
      ] as unknown as Favorite[];

      const histories = [{ food: { name: 'Phở bò' } }] as unknown as History[];

      const context = service.buildUserPrefContext(
        profile,
        favorites as unknown as Parameters<
          PromptBuilderService['buildUserPrefContext']
        >[1],
        histories as unknown as Parameters<
          PromptBuilderService['buildUserPrefContext']
        >[2],
      );

      expect(context).toContain('Mục tiêu: Giảm cân');
      expect(context).toContain('Gu: Món Việt');
      expect(context).toContain('Ngân sách: Dưới 100k');
      expect(context).toContain('Yêu thích: Bún chả');
      expect(context).toContain('Vừa xem: Phở bò');
    });
  });

  describe('buildCandidatesSection (Tối ưu hóa Candidates truyền vào RAG)', () => {
    it('nên định dạng đúng candidates dạng JSON và loại bỏ address/description dư thừa', () => {
      const candidates = [
        {
          id: 10,
          name: 'Món bún thịt nướng',
          price: 45000,
          similarity: 0.887,
          restaurantName: 'Quán test',
          distance_km: 1.2,
          address: '123 Đường Láng', // Sẽ bị loại bỏ để giảm token
          description: 'Rất ngon cay thơm', // Sẽ bị loại bỏ để giảm token
        },
      ] as unknown as Parameters<
        PromptBuilderService['buildCandidatesSection']
      >[0];

      const prompt = service.buildCandidatesSection(candidates);

      expect(prompt).toContain('Món bún thịt nướng');
      expect(prompt).toContain('45000');
      expect(prompt).toContain('0.887');
      expect(prompt).not.toContain('123 Đường Láng');
      expect(prompt).not.toContain('Rất ngon cay thơm');
    });
  });

  describe('buildSystemPrompt (Đóng gói System Prompt)', () => {
    it('nên thay thế đúng các placeholders trong mẫu system prompt', async () => {
      const systemPrompt = await service.buildSystemPrompt(
        'Bây giờ là 12:00',
        'Ngữ cảnh test',
        'Chỉ dẫn test',
        '{"cuisineType":"bún"}',
        '[{"name":"Món test"}]',
      );

      expect(systemPrompt).toContain('Bây giờ là 12:00');
      expect(systemPrompt).toContain('Ngữ cảnh test');
      expect(systemPrompt).toContain('Chỉ dẫn test');
      expect(systemPrompt).toContain('{"cuisineType":"bún"}');
      expect(systemPrompt).toContain('[{"name":"Món test"}]');
    });
  });
});
