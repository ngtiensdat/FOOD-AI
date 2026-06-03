import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RerankingService } from './reranking.service';
import { SearchResult } from '../vector.repository';
import { BusinessRuleEngineService } from './business-rule-engine.service';
import { FoodKnowledgeService } from './food-knowledge.service';

describe('RerankingService', () => {
  let service: RerankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RerankingService,
        BusinessRuleEngineService,
        FoodKnowledgeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((_key: string) => {
              return undefined; // Trả về undefined để kích hoạt cơ chế fallback tĩnh an toàn
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RerankingService>(RerankingService);
  });

  describe('calculateDistanceScore (Tính điểm suy hao khoảng cách mượt mà)', () => {
    it('nên trả về 1.0 nếu khoảng cách bằng 0/null', () => {
      expect(service.calculateDistanceScore(null)).toBe(1.0);
    });

    it('nên suy hao mượt mà ở cự ly gần', () => {
      const score1km = service.calculateDistanceScore(1.0);
      const score5km = service.calculateDistanceScore(5.0);

      expect(score1km).toBeLessThan(1.0);
      expect(score5km).toBeLessThan(score1km);
      expect(score5km).toBeGreaterThan(0.5);
    });

    it('nên chặn cận dưới (min cap) ở mức 0.5 đối với khoảng cách quá xa (>15km)', () => {
      const score15km = service.calculateDistanceScore(15.0);
      const score50km = service.calculateDistanceScore(50.0);

      expect(score15km).toBe(0.5);
      expect(score50km).toBe(0.5);
    });
  });

  describe('calculatePriceScore (Tính điểm ngân sách)', () => {
    const food: SearchResult = {
      id: 1,
      name: 'Món ăn test',
      price: 60000,
      description: '',
      image: '',
      tags: [],
      restaurantName: 'Quán test',
      address: '',
      lat: 21.0,
      lng: 105.0,
      categoryName: 'FOOD',
      embeddingSimilarity: 0.8,
      distance_km: 1.0,
      similarity: 0.8,
    };

    it('nên đạt điểm tối đa 1.0 nếu món ăn dưới ngân sách', () => {
      expect(service.calculatePriceScore(food, 80000)).toBe(1.0);
    });

    it('nên suy hao điểm tuyến tính nếu món ăn vượt ngân sách', () => {
      // price 60k, budget 50k -> score = 1 - (60 - 50) / 50 = 0.8
      expect(service.calculatePriceScore(food, 50000)).toBeCloseTo(0.8);
    });

    it('nên giới hạn cận dưới là 0.0 nếu món ăn vượt quá xa ngân sách', () => {
      expect(service.calculatePriceScore(food, 10000)).toBe(0.0);
    });
  });

  describe('calculateIntentScore (Tính điểm so khớp ý định)', () => {
    const food: SearchResult = {
      id: 2,
      name: 'Bún chả gia truyền',
      price: 50000,
      description: 'Bún chả truyền thống ngon ngọt nước dùng đậm đà',
      image: '',
      tags: ['hà nội', 'truyền thống'],
      restaurantName: 'Bún chả HN',
      address: '',
      lat: 21.0,
      lng: 105.0,
      categoryName: 'Món bún',
      embeddingSimilarity: 0.8,
      distance_km: 1.0,
      similarity: 0.8,
    };

    it('nên trả về 1.0 nếu khớp trực tiếp tên món hoặc danh mục', () => {
      expect(service.calculateIntentScore(food, 'Bún')).toBe(1.0);
    });

    it('nên trả về 0.8 nếu khớp trong mô tả hoặc tags', () => {
      expect(service.calculateIntentScore(food, 'Hà Nội')).toBe(0.8);
    });

    it('nên trả về 0.3 nếu không khớp ý định ẩm thực', () => {
      expect(service.calculateIntentScore(food, 'Trà sữa')).toBe(0.3);
    });
  });
});
