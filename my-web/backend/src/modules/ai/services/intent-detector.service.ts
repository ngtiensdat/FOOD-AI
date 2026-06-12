import { Injectable, Logger } from '@nestjs/common';
import { FoodIntent } from '../constants/food-intent.enum';
import { INTENT_ANALYZER_PROMPT_TEMPLATE } from '../prompts/intent-analyzer.prompt';
import { OpenAIService } from './openai.service';
import { SlotExtractionResult } from '../interfaces/dialogue-state.interface';
import { RedisService } from './redis.service';
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
    private readonly openaiService: OpenAIService,
    private readonly redisService: RedisService,
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
