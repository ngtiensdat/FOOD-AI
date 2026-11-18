/**
 * Mục đích: Service quản lý việc tìm kiếm vector tương đồng món ăn và chấm điểm, lọc các đề xuất phù hợp nhất.
 * File quan hệ: Kết hợp FoodRetrievalService và RerankingService.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchResult } from '../vector.repository';
import { RerankingService } from './reranking.service';
import { FoodRetrievalService } from './food-retrieval.service';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { AI_PARAMETERS } from '../constants/ai-parameters.constant';
import { FoodIntent } from '../constants/food-intent.enum';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly rerankingService: RerankingService,
    private readonly retrievalService: FoodRetrievalService,
    private readonly configService: ConfigService,
  ) {}

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  async searchAndRerank(
    userVector: number[],
    state: DialogueState,
    userLat?: number,
    userLng?: number,
    city?: string,
    district?: string,
    weather?: { temperature: number; isRaining: boolean },
    message?: string,
    intent?: FoodIntent,
    needs?: Record<string, number>,
    feedbackProfile?: {
      likedFoods: string[];
      likedCategories: string[];
      dislikedFoods: string[];
      dislikedCategories: string[];
    },
    offset = 0,
    currentHour?: number,
  ): Promise<{ foods: SearchResult[]; shouldRecommend: boolean }> {
    // 1. Retrieve candidates (uses relational fallback inside if vector results are empty)
    const rawFoods = await this.retrievalService.retrieveCandidates(
      userVector,
      userLat,
      userLng,
      city,
      district,
      state.slots.category || 'ALL',
      null, // maxDistanceKm
      intent,
      state,
      message,
      offset,
    );

    // 2. Run Context Reranking (passing intent, needs, and feedbackProfile parameters)
    const reRanked = this.rerankingService.contextReranking(
      rawFoods,
      state,
      userLat,
      userLng,
      weather,
      message,
      intent,
      needs,
      feedbackProfile,
      currentHour,
    );

    // 3. Evaluate eligibility thresholds
    const thresholds = this.getParam('thresholds', AI_PARAMETERS.THRESHOLDS);
    const minThreshold = thresholds.minSimilarity;
    const directThreshold = thresholds.directMatch;

    const matchedFoods = reRanked.filter((item) => {
      const isMatched = item.similarity >= minThreshold;
      if (isMatched) return true;

      const cuisine = state.slots.cuisineType;
      if (cuisine) {
        const intentScore = this.rerankingService.calculateIntentScore(
          item,
          cuisine,
        );
        if (intentScore >= 0.8 && item.similarity >= directThreshold) {
          return true;
        }
      }
      return false;
    });

    const hasDirectIntentMatch = reRanked.some((item) => {
      const cuisine = state.slots.cuisineType;
      if (!cuisine) return false;
      const intentScore = this.rerankingService.calculateIntentScore(
        item,
        cuisine,
      );
      return intentScore >= 0.8;
    });

    // Check if user has specified a concrete cuisine or dish type
    const hasCuisine = Boolean(
      state.slots.cuisineType && state.slots.cuisineType.trim() !== '',
    );

    const msg = message || '';
    const hasSpecificDish = this.hasSpecificDishMention(msg);
    const isVagueGeneralQuery =
      this.isGeneralRecommendationIntent(msg) && !hasSpecificDish;

    let shouldRecommend = false;
    let foods: SearchResult[] = [];

    // Decision Logic:
    // 1. Explicit nearby request with location -> recommend closest options directly
    if (intent === FoodIntent.FIND_NEARBY) {
      shouldRecommend = reRanked.length > 0;
      foods = reRanked.slice(0, 3);
    }
    // 2. Vague or general request without specific dish mentioned ("tôi đang đói", "hôm nay ăn gì")
    // Trigger clarifying slot-filling to ask for user needs and provide quick replies!
    else if (isVagueGeneralQuery && state.current_stage === 'COLLECTING') {
      shouldRecommend = false;
      foods = reRanked.slice(0, 3);
    }
    // 3. Specific cuisine or dish specified by user -> recommend matches
    else if (hasCuisine || hasSpecificDish) {
      if (hasDirectIntentMatch || matchedFoods.length > 0) {
        shouldRecommend = true;
        foods =
          matchedFoods.length > 0
            ? matchedFoods.slice(0, 5)
            : reRanked.slice(0, 3);
      } else {
        shouldRecommend = true;
        foods = reRanked.slice(0, 3);
      }
    }
    // 4. Multi-turn conversation progression (follow-up turns, answering slot questions, or feedback)
    else if (state.current_stage !== 'COLLECTING') {
      shouldRecommend = true;
      foods =
        matchedFoods.length > 0
          ? matchedFoods.slice(0, 5)
          : reRanked.slice(0, 3);
    }
    // 5. Default fallback
    else {
      shouldRecommend = false;
      foods = reRanked.slice(0, 3);
    }

    return {
      foods,
      shouldRecommend,
    };
  }

  private hasSpecificDishMention(message: string): boolean {
    const msg = message.toLowerCase();
    const specificDishes = [
      'cơm',
      'phở',
      'bún',
      'bánh mì',
      'mì',
      'miến',
      'hủ tiếu',
      'cháo',
      'xôi',
      'lẩu',
      'nướng',
      'pizza',
      'burger',
      'sushi',
      'trà sữa',
      'cà phê',
      'chè',
      'sườn',
      'gà',
      'vịt',
      'ngan',
      'hải sản',
      'tôm',
      'cua',
      'cá',
      'ốc',
      'chay',
      'cay',
      'món mặn',
      'món ngọt',
      'món nước',
      'món khô',
    ];
    return specificDishes.some((dish) => msg.includes(dish));
  }

  private isGeneralRecommendationIntent(message: string): boolean {
    const msg = message.toLowerCase();
    const keywords = [
      'ăn gì',
      'uống gì',
      'món gì',
      'gợi ý',
      'đề xuất',
      'ngon',
      'recommend',
      'suggest',
      'đói',
      'thèm',
      'quán nào',
      'món nào',
      'chọn hộ',
      'chọn giúp',
      'tư vấn',
    ];
    return keywords.some((kw) => msg.includes(kw));
  }
}
