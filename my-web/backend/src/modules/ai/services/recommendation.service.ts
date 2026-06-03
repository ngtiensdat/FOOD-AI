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
    );

    // 3. Evaluate eligibility thresholds
    const thresholds = this.getParam('thresholds', AI_PARAMETERS.THRESHOLDS);
    const minThreshold = thresholds.minSimilarity;
    const directThreshold = thresholds.directMatch;

    const matchedFoods = reRanked.filter((item) => {
      const isMatched = item.similarity >= minThreshold;
      if (isMatched) return true;

      const cuisine = state.slots.cuisineType?.toLowerCase();
      if (cuisine) {
        const nameLower = item.name.toLowerCase();
        const catNameLower = (item.categoryName || '').toLowerCase();
        if (
          (nameLower.includes(cuisine) || catNameLower.includes(cuisine)) &&
          item.similarity >= directThreshold
        ) {
          return true;
        }
      }
      return false;
    });

    const hasDirectIntentMatch = reRanked.some((item) => {
      const cuisine = state.slots.cuisineType?.toLowerCase();
      if (!cuisine) return false;
      const nameLower = item.name.toLowerCase();
      const catNameLower = (item.categoryName || '').toLowerCase();
      return nameLower.includes(cuisine) || catNameLower.includes(cuisine);
    });

    // Check if the user query is a general recommendation request
    const hasCuisine = !!state.slots.cuisineType;
    const isGeneralRec =
      !hasCuisine && message && this.isGeneralRecommendationIntent(message);

    let shouldRecommend = false;
    let foods: SearchResult[] = [];

    // If intent is FIND_NEARBY and we got candidates, we definitely want to recommend them sorted by proximity
    if (intent === FoodIntent.FIND_NEARBY) {
      shouldRecommend = reRanked.length > 0;
      foods = reRanked.slice(0, 3);
    } else if (hasCuisine) {
      shouldRecommend = matchedFoods.length > 0 || hasDirectIntentMatch;
      if (shouldRecommend) {
        foods = matchedFoods;
        if (foods.length === 0 && reRanked.length > 0) {
          foods = reRanked.slice(0, 3);
        }
      }
    } else if (isGeneralRec) {
      shouldRecommend = true;
      foods = reRanked.slice(0, 3);
    }

    return {
      foods,
      shouldRecommend,
    };
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
