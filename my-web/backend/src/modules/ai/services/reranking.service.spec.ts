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

    it('nên suy hao điểm linh hoạt theo dung sai sai lệch 20k nếu món ăn vượt nhẹ ngân sách', () => {
      // price 60k, budget 50k -> tolerance 20k, diff 10k -> score = 1 - (10 / 20) * 0.2 = 0.9
      expect(service.calculatePriceScore(food, 50000)).toBeCloseTo(0.9);
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

  describe('contextReranking (Xếp hạng ngữ cảnh & Nhận diện thời gian từ tin nhắn)', () => {
    const candidates: SearchResult[] = [
      {
        id: 1,
        name: 'Phở bò chín',
        price: 45000,
        description: 'Phở bò ăn sáng thơm ngon',
        image: '',
        tags: ['ăn sáng', 'phở'],
        restaurantName: 'Phở ngon',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Món nước',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      },
      {
        id: 2,
        name: 'Lẩu nấm gà ta',
        price: 150000,
        description: 'Lẩu nấm thích hợp ăn tối gia đình',
        image: '',
        tags: ['ăn tối', 'lẩu'],
        restaurantName: 'Lẩu gà ngon',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Lẩu',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      },
    ];

    it('nên nhận diện từ khóa "tối nay" để ưu tiên các món ăn tối ngay cả khi giờ hiện tại là sáng', () => {
      const state = {
        slots: {},
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      // Chúng ta giả định giờ hiện tại là 9:00 sáng (hour = 9).
      // Nhưng tin nhắn ghi "tối nay", nên reranking sẽ override hour = 19 (tối)
      // và tăng hạng cho món lẩu gà (id = 2) so với phở bò (id = 1).
      const reRanked = service.contextReranking(
        candidates,
        state as any,
        undefined,
        undefined,
        undefined,
        'Tôi muốn đi ăn tối nay',
        undefined,
        undefined,
        undefined,
        9, // Mock currentHour = 9 (Sáng)
      );

      // Phở bò (id: 1) có tag 'ăn sáng', lẩu nấm (id: 2) có tag 'ăn tối'.
      // Ở 19h (tối), lẩu nấm được boost, phở bò không được boost.
      // Do đó, score lẩu nấm lớn hơn phở bò.
      const pho = reRanked.find((f) => f.id === 1);
      const lau = reRanked.find((f) => f.id === 2);

      expect(lau!.similarity).toBeGreaterThan(pho!.similarity);
    });

    it('nên nhận diện từ khóa "sáng mai" để ưu tiên các món ăn sáng ngay cả khi giờ hiện tại là tối', () => {
      const state = {
        slots: {},
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      // Mock currentHour = 20 (Tối) nhưng tin nhắn có "sáng mai" -> override hour = 8
      const reRanked = service.contextReranking(
        candidates,
        state as any,
        undefined,
        undefined,
        undefined,
        'Tìm quán ăn sáng mai',
        undefined,
        undefined,
        undefined,
        20, // Mock currentHour = 20 (Tối)
      );

      const pho = reRanked.find((f) => f.id === 1);
      const lau = reRanked.find((f) => f.id === 2);

      expect(pho!.similarity).toBeGreaterThan(lau!.similarity);
    });

    it('nên phạt điểm món cay nếu người dùng có dislike cay', () => {
      const spicyFood: SearchResult = {
        id: 10,
        name: 'Mì cay 7 cấp độ',
        price: 50000,
        description: 'Mì cay hải sản siêu cay',
        image: '',
        tags: ['cay', 'hàn quốc'],
        restaurantName: 'Quán Mì Cay',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Mì',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      };
      const normalFood: SearchResult = {
        id: 11,
        name: 'Cơm tấm sườn bì chả',
        price: 50000,
        description: 'Cơm tấm thanh đạm dễ ăn',
        image: '',
        tags: ['cơm'],
        restaurantName: 'Cơm Tấm SG',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Cơm',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      };

      const state = {
        slots: { dislikes: ['cay'] },
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      const reRanked = service.contextReranking(
        [spicyFood, normalFood],
        state as any,
        undefined,
        undefined,
        undefined,
        'Gợi ý món ăn',
      );

      const rankedSpicy = reRanked.find((f) => f.id === 10);
      const rankedNormal = reRanked.find((f) => f.id === 11);
      expect(rankedNormal!.similarity).toBeGreaterThan(rankedSpicy!.similarity);
    });

    it('nên hạ điểm món sống/gỏi và ưu tiên món cháo/hầm bổ dưỡng đối với thai phụ (PREGNANT)', () => {
      const rawFood: SearchResult = {
        id: 20,
        name: 'Sashimi cá hồi sống',
        price: 150000,
        description: 'Cá hồi tươi sống chấm mù tạt',
        image: '',
        tags: ['sushi', 'sống'],
        restaurantName: 'Quán Nhật',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Món sống',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      };
      const healthyFood: SearchResult = {
        id: 21,
        name: 'Cháo bồ câu hạt sen hầm',
        price: 90000,
        description: 'Cháo bồ câu dinh dưỡng bồi bổ sức khỏe',
        image: '',
        tags: ['cháo', 'hầm', 'bồi bổ'],
        restaurantName: 'Cháo Dinh Dưỡng',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Cháo',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      };

      const state = {
        slots: { persona: 'PREGNANT' },
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      const reRanked = service.contextReranking(
        [rawFood, healthyFood],
        state as any,
        undefined,
        undefined,
        undefined,
        'Tìm món cho bà bầu',
      );

      const rankedRaw = reRanked.find((f) => f.id === 20);
      const rankedHealthy = reRanked.find((f) => f.id === 21);
      expect(rankedHealthy!.similarity).toBeGreaterThan(rankedRaw!.similarity);
    });

    it('nên loại bỏ hoàn toàn các món dị ứng chéo (ví dụ: dị ứng tôm phải lọc cả bún bề bề, tôm tít, ghẹ, mắm tôm)', () => {
      const beBeFood: SearchResult = {
        id: 30,
        name: 'Bún bề bề chua cay',
        price: 55000,
        description: 'Bún bề bề tươi ngon đậm đà hải sản vùng biển',
        image: '',
        tags: ['bún', 'bề bề', 'hải sản'],
        restaurantName: 'Bún Bề Bề Hải Phòng',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Bún',
        embeddingSimilarity: 0.9,
        distance_km: 1.0,
        similarity: 0.9,
      };

      const mamTomFood: SearchResult = {
        id: 31,
        name: 'Bún đậu mắm tôm thập cẩm',
        price: 45000,
        description: 'Bún đậu giòn ngon ăn kèm mắm tôm nguyên chất',
        image: '',
        tags: ['bún đậu', 'mắm tôm'],
        restaurantName: 'Bún Đậu Cô Ba',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Bún đậu',
        embeddingSimilarity: 0.85,
        distance_km: 1.0,
        similarity: 0.85,
      };

      const safeChickenFood: SearchResult = {
        id: 32,
        name: 'Phở gà ta đùi lá chanh',
        price: 50000,
        description: 'Phở gà thơm ngon thanh đạm',
        image: '',
        tags: ['phở gà', 'thanh đạm'],
        restaurantName: 'Phở Gà Ta',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Phở',
        embeddingSimilarity: 0.8,
        distance_km: 1.0,
        similarity: 0.8,
      };

      const state = {
        slots: { allergies: ['tôm'] },
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      const reRanked = service.contextReranking(
        [beBeFood, mamTomFood, safeChickenFood],
        state as any,
      );

      // Cả Bún bề bề và Bún đậu mắm tôm đều phải bị loại bỏ tuyệt đối vì nguy cơ dị ứng chéo sinh học
      expect(reRanked.some((f) => f.id === 30)).toBe(false);
      expect(reRanked.some((f) => f.id === 31)).toBe(false);
      // Món phở gà an toàn phải được giữ lại
      expect(reRanked.some((f) => f.id === 32)).toBe(true);
    });

    it('nên xử lý dị ứng đồng nghĩa và tiếng Anh (peanuts -> lọc kẹo lạc, chè đậu phộng)', () => {
      const keoLacFood: SearchResult = {
        id: 40,
        name: 'Kẹo lạc Sìu Châu Nam Định',
        price: 30000,
        description: 'Kẹo lạc giòn xốp rải vừng thơm nức',
        image: '',
        tags: ['kẹo lạc', 'đặc sản'],
        restaurantName: 'Quà Quê',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Ăn vặt',
        embeddingSimilarity: 0.9,
        distance_km: 1.0,
        similarity: 0.9,
      };

      const safeFood: SearchResult = {
        id: 41,
        name: 'Sữa chua dẻo trân châu',
        price: 25000,
        description: 'Sữa chua mát lạnh',
        image: '',
        tags: ['sữa chua'],
        restaurantName: 'Quán Trà',
        address: '',
        lat: 21.0,
        lng: 105.0,
        categoryName: 'Tráng miệng',
        embeddingSimilarity: 0.7,
        distance_km: 1.0,
        similarity: 0.7,
      };

      const state = {
        slots: { allergies: ['peanuts'] },
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      };

      const reRanked = service.contextReranking(
        [keoLacFood, safeFood],
        state as any,
      );

      expect(reRanked.some((f) => f.id === 40)).toBe(false);
      expect(reRanked.some((f) => f.id === 41)).toBe(true);
    });
  });
});
