// Mục đích file này để làm gì: Phân tích ý định (intent) và trích xuất các thông tin (slots) từ tin nhắn của người dùng.
// Các file khác hay file này có ý nghĩa như nào: Được gọi bởi AiService trong luồng xử lý hội thoại chính để định hướng hội thoại.
// Các chức năng đặc biệt: Tích hợp LangChain .withStructuredOutput() để lấy kết quả dạng JSON định hình sẵn, kết hợp cache Redis.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility, Dependency Injection.
// Các biến, hàm đặc biệt trong file: IntentDetectorService.

import { Injectable, Logger } from '@nestjs/common';
import { FoodIntent } from '../constants/food-intent.enum';
import { INTENT_ANALYZER_PROMPT_TEMPLATE } from '../prompts/intent-analyzer.prompt';
import { SlotExtractionResult } from '../interfaces/dialogue-state.interface';
import { RedisService } from '../../../common/redis/redis.service';
import { LangchainService } from './langchain.service';
import * as crypto from 'crypto';

interface ParsedIntentResponse {
  needs?: Record<string, number>;
  slots?: SlotExtractionResult;
  searchQuery?: string;
  reasoning?: string;
}

@Injectable()
export class IntentDetectorService {
  private readonly logger = new Logger(IntentDetectorService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly langchainService: LangchainService,
  ) {}

  async detectIntentAndSlots(message: string): Promise<{
    intent: FoodIntent;
    slots: SlotExtractionResult;
    needs: Record<string, number>;
    searchQuery: string;
    reasoning: string;
  }> {
    const normalized = message.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    const cacheKey = `intent:cache:v1:${hash}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Intent cache HIT for message: "${message}"`);
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn(`Failed to retrieve intent from cache: ${err}`);
    }
    try {
      const structuredLlm =
        this.langchainService.chatModel.withStructuredOutput(
          {
            type: 'object',
            properties: {
              needs: {
                type: 'object',
                properties: {
                  cuisine: { type: 'number' },
                  distance: { type: 'number' },
                  price: { type: 'number' },
                  weather: { type: 'number' },
                  emotion: { type: 'number' },
                  companion: { type: 'number' },
                  popularity: { type: 'number' },
                  health: { type: 'number' },
                  speed: { type: 'number' },
                },
              },
              slots: {
                type: 'object',
                properties: {
                  cuisineType: { type: 'string' },
                  budget: { type: 'number' },
                  emotion: { type: 'string' },
                  companion: { type: 'string' },
                  allergies: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
              searchQuery: { type: 'string' },
              reasoning: { type: 'string' },
            },
            required: ['needs', 'slots', 'searchQuery', 'reasoning'],
          },
          {
            name: 'intent_detector',
          },
        );

      const parsed = (await structuredLlm.invoke([
        { role: 'system', content: INTENT_ANALYZER_PROMPT_TEMPLATE },
        { role: 'user', content: message },
      ])) as ParsedIntentResponse;

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

      const result = {
        intent,
        slots: slotsResult,
        needs,
        searchQuery: parsed.searchQuery || message,
        reasoning,
      };

      try {
        await this.redisService.set(cacheKey, JSON.stringify(result), 14400); // 4 hours TTL
      } catch (err) {
        this.logger.warn(`Failed to write intent to cache: ${err}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        'Error during intent analysis, falling back to UNKNOWN.',
        error,
      );
      return {
        intent: FoodIntent.RECOMMEND_FOOD,
        slots: {},
        needs: {},
        searchQuery: message,
        reasoning: 'Fallback do lỗi OpenAI',
      };
    }
  }
}
