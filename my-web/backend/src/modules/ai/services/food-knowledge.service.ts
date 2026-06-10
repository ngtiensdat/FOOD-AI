/**
 * Mục đích: Service cung cấp kiến thức ẩm thực và lời khuyên sức khỏe cho người dùng dựa trên slots dị ứng và trạng thái.
 * File quan hệ: Được gọi bởi AiService để đính kèm lời khuyên sức khỏe vào prompt.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AI_RULES } from '../constants/ai-rules.constant';

@Injectable()
export class FoodKnowledgeService {
  private readonly logger = new Logger(FoodKnowledgeService.name);

  getWellnessAdvice(
    message: string,
  ): { advice: string; targetCuisines: string[] } | null {
    const msgLower = message.toLowerCase().trim();

    if (
      AI_RULES.WELLNESS_KEYWORDS.STRESSED.some((kw) => msgLower.includes(kw))
    ) {
      return AI_RULES.WELLNESS_ADVICE.STRESSED;
    }
    if (AI_RULES.WELLNESS_KEYWORDS.TIRED.some((kw) => msgLower.includes(kw))) {
      return AI_RULES.WELLNESS_ADVICE.TIRED;
    }
    if (AI_RULES.WELLNESS_KEYWORDS.DIET.some((kw) => msgLower.includes(kw))) {
      return AI_RULES.WELLNESS_ADVICE.DIET;
    }
    if (
      AI_RULES.WELLNESS_KEYWORDS.COLD_WEATHER.some((kw) =>
        msgLower.includes(kw),
      )
    ) {
      return AI_RULES.WELLNESS_ADVICE.COLD_WEATHER;
    }

    return null;
  }
}
