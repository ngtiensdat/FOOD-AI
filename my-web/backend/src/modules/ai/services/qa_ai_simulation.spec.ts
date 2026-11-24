import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SlotExtractorService } from './slot-extractor.service';
import { PromptBuilderService } from './prompt-builder.service';
import { RerankingService } from './reranking.service';
import { BusinessRuleEngineService } from './business-rule-engine.service';
import { FoodKnowledgeService } from './food-knowledge.service';
import { PrismaService } from '../../../database/prisma.service';
import { OpenAIService } from './openai.service';
import { VectorRepository, SearchResult } from '../vector.repository';
import { expandAllergens } from '../constants/allergen-ontology.constant';

describe('QA Customer & AI Simulation Suite (Kiểm thử Toàn diện Khách hàng & Kỹ thuật)', () => {
  let slotExtractor: SlotExtractorService;
  let promptBuilder: PromptBuilderService;
  let rerankingService: RerankingService;
  let foodKnowledge: FoodKnowledgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotExtractorService,
        PromptBuilderService,
        RerankingService,
        BusinessRuleEngineService,
        FoodKnowledgeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(() => undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            userProfile: { findUnique: jest.fn(), update: jest.fn() },
            aiFeedback: { findMany: jest.fn() },
          },
        },
        {
          provide: OpenAIService,
          useValue: { getEmbedding: jest.fn() },
        },
        {
          provide: VectorRepository,
          useValue: { updateUserEmbedding: jest.fn() },
        },
      ],
    }).compile();

    slotExtractor = module.get<SlotExtractorService>(SlotExtractorService);
    promptBuilder = module.get<PromptBuilderService>(PromptBuilderService);
    rerankingService = module.get<RerankingService>(RerankingService);
    foodKnowledge = module.get<FoodKnowledgeService>(FoodKnowledgeService);
  });

  describe('Kịch bản 1: Mẹ bầu có chồng đi tập gym (Pregnant Mom & Gym Husband)', () => {
    it('Phải xác định đúng Persona của người dùng là PREGNANT, không bị nhầm thành GYM', () => {
      const input = 'tôi có bầu và chồng tôi tập gym muốn ăn bữa tối bổ dưỡng';
      const slots = slotExtractor.extractSlotsLocally(input);

      expect(slots.persona).toBe('PREGNANT');
      expect(slots.companion).toBe('FAMILY');
    });

    it('Prompt sinh ra cho LLM phải chứa chỉ thị an toàn thai kỳ và không biến mẹ bầu thành gymbro', () => {
      const mockProfile: any = {
        userId: 110,
        preferences: {
          persona: 'PREGNANT',
          allergies: ['Đậu phộng (Lạc)'],
          dislikes: ['thịt mỡ'],
        },
      };

      const context = promptBuilder.buildUserPrefContext(mockProfile, [], []);
      expect(context).toContain('Phụ nữ mang thai / sau sinh');
      expect(context).toContain('TUYỆT ĐỐI TRÁNH đồ sống/lạnh');
      expect(context).toContain('Đậu phộng (Lạc)');
    });

    it('RerankingService CẤM TUYỆT ĐỐI gợi ý Cháo lòng, Tiết canh, Gỏi sống, Nội tạng cho Mẹ bầu (PREGNANT)', () => {
      const chaoLongDish: SearchResult = {
        id: 99,
        name: 'Cháo lòng Chuẩn Vị',
        description: 'Cháo lòng tiết canh dồi lợn luộc nóng hổi',
        price: 45000,
        similarity: 0.95,
        categoryName: 'Cháo',
        address: 'Hà Nội',
        restaurantName: 'Quán Cháo Lòng Tiết Canh',
        image: '',
        tags: ['cháo lòng', 'lòng lợn', 'tiết canh'],
        lat: 21.0,
        lng: 105.8,
        embeddingSimilarity: 0.95,
        distance_km: 1.0,
      };

      const chaoBoCauDish: SearchResult = {
        id: 100,
        name: 'Cháo Bồ Câu Hạt Sen',
        description: 'Cháo chim câu bồi bổ dinh dưỡng, nấu chín kỹ thơm ngon',
        price: 65000,
        similarity: 0.92,
        categoryName: 'Cháo',
        address: 'Hà Nội',
        restaurantName: 'Bếp Mẹ Bầu',
        image: '',
        tags: ['bồ câu', 'cháo dinh dưỡng'],
        lat: 21.0,
        lng: 105.8,
        embeddingSimilarity: 0.92,
        distance_km: 1.0,
      };

      // isUnsafeForPregnant phải phát hiện chính xác
      expect((rerankingService as any).isUnsafeForPregnant(chaoLongDish)).toBe(
        true,
      );
      expect((rerankingService as any).isUnsafeForPregnant(chaoBoCauDish)).toBe(
        false,
      );

      // Khi rerank với persona PREGNANT, cháo lòng BẮT BUỘC bị loại bỏ hoàn toàn
      const mockState: any = {
        slots: { persona: 'PREGNANT' },
      };
      const reranked = rerankingService.contextReranking(
        [chaoLongDish, chaoBoCauDish],
        mockState,
        'tìm cháo bổ dưỡng cho mẹ bầu',
      );

      const dishIds = reranked.map((d) => d.id);
      expect(dishIds).not.toContain(99); // Không bao giờ có cháo lòng
      expect(dishIds).toContain(100); // Có cháo bồ câu hạt sen
    });
  });

  describe('Kịch bản 2: Dị ứng chéo sinh học & Ngăn ngừa sốc phản vệ (Allergies & Cross-Reactivity)', () => {
    it('Khi người dùng dị ứng Tôm, hệ thống phải tự động mở rộng sang Bề bề, Tôm tít, Cua, Ghẹ, Mắm tôm', () => {
      const expansion = expandAllergens(['tôm']);

      expect(expansion.searchKeywords).toContain('be be');
      expect(expansion.searchKeywords).toContain('tom tit');
      expect(expansion.searchKeywords).toContain('cua');
      expect(expansion.searchKeywords).toContain('ghe');
      expect(expansion.searchKeywords).toContain('mam tom');
      expect(expansion.crossReactionsInfo.length).toBeGreaterThan(0);
      expect(expansion.crossReactionsInfo[0]).toContain('bề bề');
    });

    it('RerankingService phải lọc triệt để món Bề bề và Mắm tôm khi người dùng dị ứng Tôm', () => {
      const shrimpAllergies = ['tôm'];

      const mockDishes: SearchResult[] = [
        {
          id: 1,
          name: 'Bún Bề Bề Hải Phòng',
          description: 'Bún hải sản với thịt bề bề tươi ngọt đậm đà',
          price: 45000,
          similarity: 0.95,
          categoryName: 'Món nước',
          address: 'Hà Nội',
          restaurantName: 'Quán Hải Sản',
          image: '',
          tags: ['bề bề', 'hải sản'],
          lat: 21.0,
          lng: 105.8,
          embeddingSimilarity: 0.95,
          distance_km: 1.2,
        },
        {
          id: 2,
          name: 'Bún Đậu Mắm Tôm Phố Cổ',
          description: 'Bún đậu rán giòn kèm mắm tôm Thanh Hóa',
          price: 40000,
          similarity: 0.92,
          categoryName: 'Bún đậu',
          address: 'Hà Nội',
          restaurantName: 'Bún Đậu',
          image: '',
          tags: ['mắm tôm'],
          lat: 21.0,
          lng: 105.8,
          embeddingSimilarity: 0.92,
          distance_km: 1.5,
        },
        {
          id: 3,
          name: 'Phở Bò Tái Chín Lò Đúc',
          description:
            'Phở bò gia truyền nước dùng trong thanh ngọt từ xương bò',
          price: 50000,
          similarity: 0.88,
          categoryName: 'Phở',
          address: 'Hà Nội',
          restaurantName: 'Phở Bò',
          image: '',
          tags: ['thịt bò'],
          lat: 21.0,
          lng: 105.8,
          embeddingSimilarity: 0.88,
          distance_km: 2.0,
        },
      ];

      // Món bề bề có chứa dị nguyên giáp xác
      expect(
        (rerankingService as any).hasAllergens(mockDishes[0], shrimpAllergies),
      ).toBe(true);
      // Món mắm tôm có chứa dị nguyên tôm
      expect(
        (rerankingService as any).hasAllergens(mockDishes[1], shrimpAllergies),
      ).toBe(true);
      // Phở bò an toàn
      expect(
        (rerankingService as any).hasAllergens(mockDishes[2], shrimpAllergies),
      ).toBe(false);
    });
  });

  describe('Kịch bản 3: Chống bẫy câu hỏi nghi vấn (Inquiry Resistance)', () => {
    it('Khi người dùng hỏi "tôi dị ứng gì vậy", hệ thống KHÔNG ĐƯỢC trích xuất "gì vậy" làm dị ứng', () => {
      const slots = slotExtractor.extractSlotsLocally('tôi dị ứng gì vậy');
      expect(slots.allergies).toBeUndefined();

      const directAllergies =
        slotExtractor.extractAllergies('tôi dị ứng gì vậy');
      expect(directAllergies).toEqual([]);
    });

    it('Khi người dùng hỏi "tôi đang kiêng ăn món gì thế nhỉ", KHÔNG trích xuất từ hỏi làm dislikes', () => {
      const slots = slotExtractor.extractSlotsLocally(
        'tôi đang kiêng ăn món gì thế nhỉ',
      );
      expect(slots.dislikes).toBeUndefined();

      const directDislikes = slotExtractor.extractDislikes(
        'tôi đang kiêng ăn món gì thế nhỉ',
      );
      expect(directDislikes).toEqual([]);
    });
  });

  describe('Kịch bản 4: Xử lý phủ định & Khẩu vị kiêng khem (Negation Handling)', () => {
    it('Phải phân biệt chính xác: "không thích ăn cay, tìm quán cơm sườn" -> Dislike cay, Thích cơm sườn', () => {
      const input = 'tôi không thích ăn cay, đừng cho hành, tìm quán cơm sườn';
      const slots = slotExtractor.extractSlotsLocally(input);

      expect(slots.cuisineType).toBe('cơm sườn');
      expect(slots.dislikes).toEqual(expect.arrayContaining(['cay', 'hành']));
      expect(slots.cuisineType).not.toContain('cay');
    });
  });

  describe('Kịch bản 5: Ngân sách & Ngưỡng dung sai thực tế (Budget Parsing)', () => {
    it('Trích xuất chuẩn xác các định dạng ngân sách tiếng Việt', () => {
      expect(slotExtractor.parseBudget('quán cơm dưới 35k')).toBe(35000);
      expect(slotExtractor.parseBudget('tầm 40.000đ')).toBe(40000);
      expect(slotExtractor.parseBudget('khoảng 1.5 triệu')).toBe(1500000);
      expect(slotExtractor.parseBudget('ngân sách 2tr')).toBe(2000000);
    });
  });

  describe('Kịch bản 6: Tình huống nghịch lý - Nhà sư đòi ăn thịt', () => {
    it('Phải nhận diện "tôi là nhà sư" thuộc Persona VEGAN', () => {
      const input = 'tôi là nhà sư nhưng hôm nay thèm ăn thịt';
      const slots = slotExtractor.extractSlotsLocally(input);

      expect(slots.persona).toBe('VEGAN');
    });
  });

  describe('Kịch bản 7: Hệ thống nhận diện & phát cảnh báo nguy cơ thực phẩm gây hại (Health Hazard Warning Engine)', () => {
    it('Mẹ bầu hỏi hoặc thèm cháo lòng: PHẢI phát hiện nguy cơ và trả về cảnh báo y khoa về Listeria và liên cầu lợn', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'sao bạn gợi ý cháo lòng cho tôi vậy',
        {
          persona: 'PREGNANT',
        },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain(
        'Mẹ bầu tuyệt đối không nên dùng cháo lòng',
      );
      expect(hazard!.scientificReason).toContain('Streptococcus suis');
      expect(hazard!.scientificReason).toContain('Listeria');
      expect(hazard!.safeAlternativeSuggestion).toContain(
        'Cháo bồ câu hạt sen',
      );
    });

    it('Mẹ bầu hỏi rau ngót/ngải cứu: PHẢI cảnh báo nguy cơ co bóp tử cung', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'tôi có bầu ăn nhiều rau ngót được không',
        {
          persona: 'PREGNANT',
        },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain('rau ngót');
      expect(hazard!.scientificReason).toContain('co thắt cơ trơn tử cung');
    });

    it('Người dị ứng tôm nhưng hỏi món bề bề: PHẢI cảnh báo nguy cơ sốc phản vệ và dị ứng chéo', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'cho tôi ăn bún bề bề tôm tít nhé',
        { allergies: ['Tôm (Shrimp)'] },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain('Cảnh báo nguy cơ sốc phản vệ');
    });

    it('Người đau dạ dày nhưng đòi ăn mì cay xè: PHẢI cảnh báo nguy cơ loét dạ dày', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'tôi thèm mì cay cấp 7 sa tế ớt hiểm',
        { specialNotes: 'tôi bị đau dạ dày và trào ngược' },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain('Cảnh báo bệnh lý dạ dày');
      expect(hazard!.scientificReason).toContain('Capsaicin');
    });

    it('Người tiểu đường hỏi đồ ngọt: PHẢI cảnh báo nguy cơ tăng đường huyết', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'cho tôi ly trà sữa full đường nhiều chè ngọt',
        { specialNotes: 'tôi bị tiểu đường tuýp 2' },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain('chỉ số đường huyết');
      expect(hazard!.scientificReason).toContain('glucose');
    });

    it('Người bị Gout hỏi nội tạng/tiết canh/hải sản: PHẢI cảnh báo cơn đau gút cấp', () => {
      const hazard = foodKnowledge.detectHealthHazard(
        'tối nay đi ăn đĩa lòng lợn tiết canh uống bia',
        { specialNotes: 'tôi bị bệnh gút axit uric cao' },
      );

      expect(hazard).not.toBeNull();
      expect(hazard!.warningMessage).toContain('Cảnh báo bệnh Gút');
      expect(hazard!.scientificReason).toContain('axit uric');
    });
  });
});
