import { Test, TestingModule } from '@nestjs/testing';
import { FoodModerationService } from './food-moderation.service';
import { LangchainService } from './langchain.service';

describe('FoodModerationService', () => {
  let service: FoodModerationService;
  let mockLangchainService: { chatModel: { invoke: jest.Mock } };

  beforeEach(async () => {
    mockLangchainService = {
      chatModel: {
        invoke: jest.fn().mockResolvedValue({
          content: JSON.stringify({
            isApproved: true,
            confidence: 0.95,
            reason: 'Món ăn hợp lệ và an toàn.',
          }),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodModerationService,
        { provide: LangchainService, useValue: mockLangchainService },
      ],
    }).compile();

    service = module.get<FoodModerationService>(FoodModerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Rule-based Guardrails (Layer 1)', () => {
    it('should reject food with price <= 0', async () => {
      const result = await service.moderateFood({
        name: 'Trà Sữa Trân Châu',
        price: 0,
      });

      expect(result.isApproved).toBe(false);
      expect(result.reason).toContain('Giá món ăn không hợp lệ');
      expect(mockLangchainService.chatModel.invoke).not.toHaveBeenCalled();
    });

    it('should reject food with unreasonably high price (> 100M)', async () => {
      const result = await service.moderateFood({
        name: 'Bò Wagyu Thượng Hạng',
        price: 150_000_000,
      });

      expect(result.isApproved).toBe(false);
      expect(result.reason).toContain('vượt quá giới hạn tối đa');
      expect(mockLangchainService.chatModel.invoke).not.toHaveBeenCalled();
    });

    it('should reject food containing blacklisted drugs or illegal substances', async () => {
      const result = await service.moderateFood({
        name: 'Bánh ngọt vị cần sa đặc biệt',
        price: 50000,
      });

      expect(result.isApproved).toBe(false);
      expect(result.flaggedKeywords).toContain('cần sa');
      expect(result.reason).toContain('từ khóa vi phạm tiêu chuẩn cộng đồng');
      expect(mockLangchainService.chatModel.invoke).not.toHaveBeenCalled();
    });

    it('should reject food containing endangered animal meat', async () => {
      const result = await service.moderateFood({
        name: 'Đặc sản thịt hổ nướng mật ong',
        price: 500000,
      });

      expect(result.isApproved).toBe(false);
      expect(result.flaggedKeywords).toContain('thịt hổ');
      expect(mockLangchainService.chatModel.invoke).not.toHaveBeenCalled();
    });
  });

  describe('LLM Moderation (Layer 2)', () => {
    it('should approve valid and healthy food item via LLM', async () => {
      const result = await service.moderateFood({
        name: 'Phở Bò Tái Nạm Hà Nội',
        description: 'Phở bò truyền thống nước dùng hầm xương 12 tiếng',
        price: 65000,
        tags: ['Phở', 'Bò', 'Món nước'],
      });

      expect(result.isApproved).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(mockLangchainService.chatModel.invoke).toHaveBeenCalled();
    });

    it('should gracefully fallback to approval when LLM service throws an error', async () => {
      mockLangchainService.chatModel.invoke.mockRejectedValueOnce(
        new Error('OpenAI Rate limit exceeded'),
      );

      const result = await service.moderateFood({
        name: 'Cơm Tấm Sườn Bì Chả',
        price: 55000,
      });

      expect(result.isApproved).toBe(true);
      expect(result.reason).toContain('Guardrails');
    });
  });
});
