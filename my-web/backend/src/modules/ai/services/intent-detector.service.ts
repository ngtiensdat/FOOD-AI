/**
 * Mục đích: Service thực hiện phân tích ý định và trích xuất thực thể (slots) từ tin nhắn của người dùng sử dụng LLM.
 * File quan hệ: Được gọi bởi AiService ở đầu luồng hội thoại.
 */

import { Injectable, Logger } from '@nestjs/common';
import { FoodIntent } from '../constants/food-intent.enum';
import { INTENT_ANALYZER_PROMPT_TEMPLATE } from '../prompts/intent-analyzer.prompt';
import { OpenAIService } from './openai.service';
import { SlotExtractionResult } from '../interfaces/dialogue-state.interface';

interface ParsedIntentResponse {
  needs?: Record<string, number>;
  slots?: SlotExtractionResult;
  reasoning?: string;
}

@Injectable()
export class IntentDetectorService {
  private readonly logger = new Logger(IntentDetectorService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  async detectIntentAndSlots(message: string): Promise<{
    intent: FoodIntent;
    slots: SlotExtractionResult;
    needs: Record<string, number>;
    reasoning: string;
  }> {
    try {
      const responseText = await this.openaiService.chatCompletion(
        INTENT_ANALYZER_PROMPT_TEMPLATE,
        [{ role: 'user', content: message }],
      );

      let parsed: ParsedIntentResponse;
      try {
        parsed = JSON.parse(responseText) as ParsedIntentResponse;
      } catch (err) {
        this.logger.error(
          'Failed to parse intent JSON, falling back to heuristics.',
        );
        parsed = { needs: {}, slots: {}, reasoning: 'Lỗi parse JSON' };
      }

      const needs = parsed.needs || {};
      const slots = parsed.slots || {};
      const reasoning = parsed.reasoning || '';

      // Determine intent based on needs priority scores
      let intent = FoodIntent.RECOMMEND_FOOD;

      if (needs.distance > 0.75) {
        intent = FoodIntent.FIND_NEARBY;
      } else if (needs.price > 0.75) {
        intent = FoodIntent.FIND_BY_BUDGET;
      } else if (needs.health > 0.75) {
        intent = FoodIntent.HEALTHY_FOOD;
      } else if (needs.emotion > 0.75) {
        intent = FoodIntent.EMOTION_BASED;
      } else if (needs.weather > 0.75) {
        intent = FoodIntent.WEATHER_BASED;
      } else if (slots.cuisineType && needs.cuisine > 0.6) {
        intent = FoodIntent.FIND_BY_CUISINE;
      }

      this.logger.log(
        `[Intent Analysis] Detected Intent: ${intent} | Reasoning: ${reasoning}`,
      );

      // Map slots to required typings
      const slotsResult: SlotExtractionResult = {
        cuisineType: slots.cuisineType || undefined,
        budget: slots.budget ? Number(slots.budget) : undefined,
        emotion: slots.emotion || undefined,
        companion: slots.companion || undefined,
        allergies: slots.allergies || undefined,
      };

      return {
        intent,
        slots: slotsResult,
        needs,
        reasoning,
      };
    } catch (error) {
      this.logger.error(
        'Error during intent analysis, falling back to UNKNOWN.',
        error,
      );
      return {
        intent: FoodIntent.RECOMMEND_FOOD,
        slots: {},
        needs: {},
        reasoning: 'Fallback do lỗi OpenAI',
      };
    }
  }
}
