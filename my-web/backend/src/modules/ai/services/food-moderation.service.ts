// Mục đích file này để làm gì: Cung cấp dịch vụ kiểm duyệt nội dung món ăn tự động bằng AI (AI Content Moderation).
// Các file khác hay file này có ý nghĩa như nào: Được gọi bởi FoodService khi chủ nhà hàng tạo món mới hoặc chỉnh sửa món ăn để tự động phê duyệt an toàn.
// Các chức năng đặc biệt: Kiến trúc Hybrid 2 lớp: Lớp 1 (Rule-based Guardrails) lọc từ cấm, giá bất thường; Lớp 2 (LLM Evaluation) phân tích ngữ nghĩa qua LangChain/OpenAI.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Hybrid Moderation Pattern, Circuit Breaker / Graceful Fallback, Single Responsibility.
// Các biến, hàm đặc biệt trong file: FoodModerationService, moderateFood().

import { Injectable, Logger } from '@nestjs/common';
import { LangchainService } from './langchain.service';

export interface FoodModerationInput {
  name: string;
  description?: string | null;
  tags?: string[] | null;
  price: number;
  image?: string | null;
}

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  reason: string;
  flaggedKeywords?: string[];
}

/** Danh sách các từ khóa cấm nghiêm ngặt trong tên/mô tả món ăn */
const BLACKLIST_KEYWORDS = [
  // Chất cấm, ma túy, chất kích thích độc hại
  'ma túy',
  'ma tuý',
  'heroin',
  'cocaine',
  'cần sa',
  'thuốc lắc',
  'bóng cười',
  'cỏ mỹ',
  'chất độc',
  'thuốc trừ sâu',
  'xyanua',
  'thuốc phiện',
  // Động vật hoang dã cấm buôn bán, tiêu thụ
  'thịt hổ',
  'vảy tê tê',
  'sừng tê giác',
  'ngà voi',
  'thịt gấu',
  'mật gấu',
  'thịt rùa biển',
  // Từ ngữ thô tục, khiêu dâm
  'khiêu dâm',
  'sex',
  'đồi trụy',
  'giao cấu',
];

const MAX_REASONABLE_PRICE = 100_000_000; // 100 triệu VNĐ
const MIN_REASONABLE_PRICE = 100; // 100 VNĐ

@Injectable()
export class FoodModerationService {
  private readonly logger = new Logger(FoodModerationService.name);

  constructor(private readonly langchainService: LangchainService) {}

  /**
   * Kiểm duyệt món ăn tự động kết hợp Guardrails quy tắc và LLM
   */
  async moderateFood(input: FoodModerationInput): Promise<ModerationResult> {
    // === LỚP 1: RULE-BASED GUARDRAILS (Tốc độ tức thì) ===
    const ruleResult = this.checkRuleGuardrails(input);
    if (!ruleResult.isApproved) {
      this.logger.warn(
        `[Moderation Layer 1] Món "${input.name}" bị từ chối bởi Rule-based Guardrails: ${ruleResult.reason}`,
      );
      return ruleResult;
    }

    // === LỚP 2: LLM MODERATION (Phân tích ngữ nghĩa ngữ cảnh) ===
    try {
      const llmResult = await this.checkWithLLM(input);
      this.logger.log(
        `[Moderation Layer 2] Món "${input.name}" kết quả LLM: approved=${llmResult.isApproved}, reason="${llmResult.reason}"`,
      );
      return llmResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[Moderation Fallback] Lỗi khi gọi LLM (${msg}), sử dụng kết quả phê duyệt an toàn từ Lớp 1.`,
      );
      // Khi LLM offline/lỗi mạng, tin cậy lớp Rule Guardrails an toàn để không chặn chủ quán
      return {
        isApproved: true,
        confidence: 0.85,
        reason:
          'Phê duyệt tự động dựa trên tiêu chuẩn an toàn Guardrails (Hệ thống LLM đang bảo trì).',
      };
    }
  }

  /**
   * Lớp 1: Kiểm tra tính hợp lệ về giá và từ khóa cấm
   */
  private checkRuleGuardrails(input: FoodModerationInput): ModerationResult {
    // 1. Kiểm tra tính hợp lý của giá
    if (input.price < MIN_REASONABLE_PRICE) {
      return {
        isApproved: false,
        confidence: 1.0,
        reason: `Giá món ăn không hợp lệ (nhỏ hơn mức tối thiểu ${MIN_REASONABLE_PRICE.toLocaleString('vi-VN')}đ).`,
      };
    }

    if (input.price > MAX_REASONABLE_PRICE) {
      return {
        isApproved: false,
        confidence: 1.0,
        reason: `Giá món ăn vượt quá giới hạn tối đa cho phép (${MAX_REASONABLE_PRICE.toLocaleString('vi-VN')}đ).`,
      };
    }

    // 2. Kiểm tra độ dài tên món ăn
    const trimmedName = input.name?.trim() || '';
    if (trimmedName.length < 2 || trimmedName.length > 150) {
      return {
        isApproved: false,
        confidence: 1.0,
        reason: 'Tên món ăn phải có độ dài từ 2 đến 150 ký tự.',
      };
    }

    // 3. Quét từ khóa vi phạm trong tên, mô tả và tags
    const combinedContent = [
      trimmedName,
      input.description || '',
      ...(input.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    const matchedViolations: string[] = [];
    for (const keyword of BLACKLIST_KEYWORDS) {
      if (combinedContent.includes(keyword)) {
        matchedViolations.push(keyword);
      }
    }

    if (matchedViolations.length > 0) {
      return {
        isApproved: false,
        confidence: 1.0,
        flaggedKeywords: matchedViolations,
        reason: `Nội dung chứa từ khóa vi phạm tiêu chuẩn cộng đồng: "${matchedViolations.join(', ')}".`,
      };
    }

    return {
      isApproved: true,
      confidence: 0.95,
      reason: 'Thông qua kiểm tra quy chuẩn an toàn Rule-based Guardrails.',
    };
  }

  /**
   * Lớp 2: Gọi LLM ChatModel để phân tích ngữ nghĩa chuyên sâu
   */
  private async checkWithLLM(
    input: FoodModerationInput,
  ): Promise<ModerationResult> {
    const prompt = `Bạn là hệ thống kiểm duyệt nội dung tự động chuyên nghiệp (AI Content Moderator) cho nền tảng ẩm thực FOOD_AI.
Hãy đánh giá xem thông tin món ăn sau đây có an toàn, hợp lệ, có ý nghĩa và phù hợp với tiêu chuẩn thực đơn nhà hàng hay không:

- Tên món ăn: "${input.name}"
- Giá: ${input.price} VNĐ
- Mô tả: "${input.description || 'Không có'}"
- Nhãn thẻ (Tags): "${input.tags?.join(', ') || 'Không có'}"

QUY TẮC ĐÁNH GIÁ:
1. isApproved = true nếu đây là món ăn, thức uống, món tráng miệng hoặc dịch vụ ăn uống hợp lý, không vi phạm pháp luật.
2. isApproved = false nếu nội dung vô nghĩa (chuỗi ký tự rác spam ngẫu nhiên), chứa nội dung đồi trụy, chất cấm, bạo lực, lừa đảo, hoặc xúc phạm người khác.
3. Trả về DUY NHẤT một đối tượng JSON hợp lệ (không kèm bất kỳ văn bản hay markdown nào khác) theo định dạng:
{"isApproved": boolean, "confidence": number, "reason": "giải thích ngắn gọn 1 câu bằng tiếng Việt"}`;

    const response = await this.langchainService.chatModel.invoke([
      { role: 'user', content: prompt },
    ]);

    const rawText =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    // Trích xuất JSON từ chuỗi kết quả
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`LLM output không chứa JSON hợp lệ: ${rawText}`);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      isApproved?: boolean;
      confidence?: number;
      reason?: string;
    };

    return {
      isApproved:
        typeof parsed.isApproved === 'boolean' ? parsed.isApproved : true,
      confidence:
        typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      reason: parsed.reason || 'Món ăn đạt chuẩn kiểm duyệt của AI.',
    };
  }
}
