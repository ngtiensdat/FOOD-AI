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
      msgLower.includes('stress') ||
      msgLower.includes('căng thẳng') ||
      msgLower.includes('áp lực')
    ) {
      return AI_RULES.WELLNESS_ADVICE.STRESSED;
    }
    if (
      msgLower.includes('mệt') ||
      msgLower.includes('oải') ||
      msgLower.includes('đuối') ||
      msgLower.includes('kiệt sức')
    ) {
      return AI_RULES.WELLNESS_ADVICE.TIRED;
    }
    if (
      msgLower.includes('giảm cân') ||
      msgLower.includes('diet') ||
      msgLower.includes('healthy') ||
      msgLower.includes('giảm mỡ') ||
      msgLower.includes('ít calo')
    ) {
      return AI_RULES.WELLNESS_ADVICE.DIET;
    }
    if (
      msgLower.includes('lạnh') ||
      msgLower.includes('rét') ||
      msgLower.includes('gió mùa') ||
      msgLower.includes('đông về')
    ) {
      return AI_RULES.WELLNESS_ADVICE.COLD_WEATHER;
    }

    return null;
  }
}
