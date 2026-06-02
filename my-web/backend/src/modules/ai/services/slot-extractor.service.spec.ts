import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SlotExtractorService } from './slot-extractor.service';

describe('SlotExtractorService', () => {
  let service: SlotExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotExtractorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              return undefined; // Trả về undefined để kích hoạt cơ chế fallback tĩnh an toàn
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SlotExtractorService>(SlotExtractorService);
  });

  describe('parseBudget (Trích xuất Ngân sách tiếng Việt tinh chuẩn)', () => {
    const cases = [
      { input: 'dưới 50k', expected: 50000 },
      { input: 'khoảng 50.000đ', expected: 50000 },
      { input: 'tầm 50,000 đồng', expected: 50000 },
      { input: 'dưới 100 nghìn', expected: 100000 },
      { input: 'khoảng 1 triệu', expected: 1000000 },
      { input: 'dưới 1.5 triệu', expected: 1500000 },
      { input: 'tầm 2,5 triệu', expected: 2500000 },
      { input: 'ngân sách 2tr', expected: 2000000 },
      { input: 'dưới 2.5tr', expected: 2500000 },
      { input: 'tầm 2,5tr', expected: 2500000 },
    ];

    cases.forEach(({ input, expected }) => {
      it(`nên trích xuất chính xác "${input}" -> ${expected}`, () => {
        const result = service.parseBudget(input);
        expect(result).toBe(expected);
      });
    });

    it('nên trả về undefined nếu không có từ khóa ngân sách', () => {
      expect(service.parseBudget('tôi muốn ăn bún chả')).toBeUndefined();
    });
  });

  describe('extractCuisineType (Trích xuất Món ăn/Khẩu vị)', () => {
    it('nên trích xuất món ăn từ "thèm ăn bún chả"', () => {
      const result = service.extractCuisineType('thèm ăn bún chả gần đây');
      expect(result).toBe('bún chả');
    });

    it('nên trích xuất món ăn từ "muốn uống trà sữa"', () => {
      const result = service.extractCuisineType('muốn uống trà sữa trân châu');
      expect(result).toBe('trà sữa trân');
    });

    it('nên loại bỏ các từ khóa nhiễu tiếng Việt thừa ở cuối', () => {
      const result = service.extractCuisineType(
        'tôi thèm bún bò huế cay ngon rẻ ở đây',
      );
      expect(result).toBe('bún bò huế');
    });
  });

  describe('Fuzzy & Synonym Matching (So khớp mờ & Từ đồng nghĩa)', () => {
    it('nên nhận diện companion FAMILY từ "đi cùng bố mẹ"', () => {
      const slots = service.extractSlotsLocally('muốn ăn tối cùng bố mẹ');
      expect(slots.companion).toBe('FAMILY');
    });

    it('nên nhận diện companion SINGLE từ từ đồng nghĩa "lẻ loi"', () => {
      const slots = service.extractSlotsLocally('hôm nay ăn lẻ loi quá');
      expect(slots.companion).toBe('SINGLE');
    });

    it('nên nhận diện companion DATE từ "hẹn hò với ghẹ"', () => {
      const slots = service.extractSlotsLocally('muốn đi hẹn hò với ghẹ yêu');
      expect(slots.companion).toBe('DATE');
    });

    it('nên sửa sai chính tả bằng Levenshtein (Fuzzy Match "stres" -> "STRESSED")', () => {
      const slots = service.extractSlotsLocally('tôi đang bị stres quá');
      expect(slots.emotion).toBe('STRESSED');
    });

    it('nên sửa sai chính tả bằng Levenshtein (Fuzzy Match "kiet suc" -> "TIRED")', () => {
      const slots = service.extractSlotsLocally('hôm nay đi làm kiet suc ghê');
      expect(slots.emotion).toBe('TIRED');
    });
  });
});
