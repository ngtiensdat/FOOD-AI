process.env.JWT_SECRET = 'test-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingCacheService } from './embedding-cache.service';

describe('EmbeddingCacheService', () => {
  let service: EmbeddingCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingCacheService],
    }).compile();

    service = module.get<EmbeddingCacheService>(EmbeddingCacheService);
    // Giả lập Redis offline để kích hoạt Graceful Memory Fallback phục vụ test
    service['isRedisAvailable'] = false;
  });

  describe('Bản vá Fallback bộ nhớ đệm (In-memory cache fallback)', () => {
    it('nên ghi nhận cache miss khi chưa lưu khóa', async () => {
      const result = await service.get('Món cơm tấm');
      expect(result).toBeNull();
    });

    it('nên ghi nhận cache hit và trả về đúng mảng vector đã lưu', async () => {
      const vector = [0.1, 0.25, -0.05, 0.9];
      await service.set('Món cơm tấm', vector);

      const cached = await service.get('Món cơm tấm');
      expect(cached).toEqual(vector);
    });

    it('nên tự động chuẩn hóa văn bản trước khi hash/lưu cache', async () => {
      const vector = [0.99, -0.12];
      await service.set('   PHỞ BÒ  ', vector);

      const cached = await service.get('phở bò');
      expect(cached).toEqual(vector);
    });
  });

  describe('Tạo khóa Cache key versioning', () => {
    it('nên tạo key theo đúng phiên bản v2 và mã hex SHA256', () => {
      const text = 'trà sữa';
      const key = service['getCacheKey'](text);

      expect(key.startsWith('embedding:v2:')).toBe(true);
      expect(key.length).toBe(13 + 64); // "embedding:v2:" (13 chars) + SHA256 hex (64 chars)
    });
  });
});
