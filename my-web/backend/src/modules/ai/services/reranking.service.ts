import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchResult } from '../vector.repository';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { AI_PARAMETERS } from '../constants/ai-parameters.constant';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';

@Injectable()
export class RerankingService {
  constructor(private readonly configService: ConfigService) {}

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  contextReranking(
    candidates: SearchResult[],
    state: DialogueState,
    userLat?: number,
    userLng?: number,
    weather?: { temperature: number; isRaining: boolean },
  ): SearchResult[] {
    const currentHour = new Date().getHours();
    const temp = weather?.temperature ?? 28;
    const isRaining = weather?.isRaining ?? false;

    const weights = this.getParam('weights', AI_PARAMETERS.WEIGHTS);

    const reRanked = candidates.map((food) => {
      // 1. Loại trừ nếu món nằm trong rejected_food_ids
      if (state.rejected_food_ids.includes(Number(food.id))) {
        return { ...food, similarity: 0.0 };
      }

      const intentScore = this.calculateIntentScore(
        food,
        state.slots.cuisineType,
      );
      const embeddingScore = this.calculateEmbeddingScore(food);
      const distanceScore = this.calculateDistanceScore(food.distance_km);
      const priceScore = this.calculatePriceScore(food, state.slots.budget);
      const ratingScore = this.calculateRatingScore();
      const contextScore = this.calculateContextScore(
        food,
        state.slots.mobility,
        state.slots.emotion,
        currentHour,
        temp,
        isRaining,
      );

      // Tính FinalScore theo tỷ lệ từ cấu hình tập trung
      const finalScore =
        intentScore * weights.intent +
        embeddingScore * weights.embedding +
        distanceScore * weights.distance +
        priceScore * weights.price +
        ratingScore * weights.rating +
        contextScore * weights.context;

      return {
        ...food,
        similarity: Number(finalScore.toFixed(4)),
      };
    });

    return reRanked.sort((a, b) => b.similarity - a.similarity);
  }

  calculateIntentScore(food: SearchResult, cuisineType?: string): number {
    let intentScore = 0.5;
    const cuisine = cuisineType?.toLowerCase();
    if (cuisine) {
      const nameLower = food.name.toLowerCase();
      const descLower = (food.description || '').toLowerCase();
      const tagsJoined = (food.tags || []).join(' ').toLowerCase();
      const catNameLower = (food.categoryName || '').toLowerCase();

      if (nameLower.includes(cuisine) || catNameLower.includes(cuisine)) {
        intentScore = 1.0;
      } else if (descLower.includes(cuisine) || tagsJoined.includes(cuisine)) {
        intentScore = 0.8;
      } else {
        intentScore = 0.3;
      }
    }
    return intentScore;
  }

  calculateEmbeddingScore(food: SearchResult): number {
    return food.embeddingSimilarity || 0.0;
  }

  calculateDistanceScore(distance_km: number | null): number {
    let distanceScore = 1.0;
    if (distance_km !== null) {
      const thresholds = this.getParam('thresholds', AI_PARAMETERS.THRESHOLDS);
      const decay = this.getParam('decay', AI_PARAMETERS.DECAY);
      // Hàm decay mũ liên tục và mượt mà sử dụng các hệ số cấu hình
      distanceScore = Math.max(
        thresholds.rerankingMinDistanceScore,
        Math.exp(decay.distanceFactor * distance_km),
      );
    }
    return distanceScore;
  }

  calculatePriceScore(food: SearchResult, maxBudget?: number): number {
    let priceScore = 1.0;
    if (maxBudget && food.price) {
      const budget = Number(maxBudget);
      if (food.price <= budget) {
        priceScore = 1.0;
      } else {
        priceScore = Math.max(0, 1 - (food.price - budget) / budget);
      }
    }
    return priceScore;
  }

  calculateRatingScore(): number {
    const defaultValues = this.getParam(
      'defaultValues',
      AI_PARAMETERS.DEFAULT_VALUES,
    );
    return defaultValues.rerankingDefaultRating;
  }

  calculateContextScore(
    food: SearchResult,
    mobility?: 'LAZY' | 'NORMAL' | 'EXPLORE',
    emotion?: 'TIRED' | 'REWARD' | 'STRESSED' | 'NORMAL',
    currentHour = 12,
    temp = 28,
    isRaining = false,
  ): number {
    let contextScore = 0.5;
    const nameAndTags =
      `${food.name} ${(food.tags || []).join(' ')} ${food.categoryName || ''}`.toLowerCase();

    // a. Time of day
    const timeSlots = AI_CONSTANTS.RERANK_KEYWORDS.TIME_SLOTS;
    if (currentHour >= 6 && currentHour <= 9) {
      if (timeSlots.MORNING.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
    } else if (currentHour >= 11 && currentHour <= 13) {
      if (timeSlots.LUNCH.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
    } else if (currentHour >= 18 && currentHour <= 21) {
      if (timeSlots.DINNER.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
    } else if (currentHour >= 22 || currentHour <= 4) {
      if (timeSlots.LATE_NIGHT.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
    }

    // b. Weather
    const weatherKws = AI_CONSTANTS.RERANK_KEYWORDS.WEATHER;
    if (temp > 33) {
      if (weatherKws.HOT.BOOST.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
      if (weatherKws.HOT.PENALIZE.some((kw) => nameAndTags.includes(kw))) {
        contextScore -= 0.25;
      }
    } else if (temp < 20 || isRaining) {
      if (weatherKws.COLD_OR_RAIN.some((kw) => nameAndTags.includes(kw))) {
        contextScore += 0.25;
      }
    }

    // c. Mobility
    const limits = this.getParam(
      'mobilityLimits',
      AI_PARAMETERS.MOBILITY_LIMITS,
    );
    if (mobility === 'LAZY' && food.distance_km !== null) {
      if (food.distance_km < limits.lazyNearKm) {
        contextScore += 0.25;
      } else if (food.distance_km > limits.lazyFarKm) {
        contextScore -= 0.3;
      }
    } else if (mobility === 'EXPLORE' && food.distance_km !== null) {
      if (food.distance_km > limits.exploreMinKm) {
        contextScore += 0.2;
      }
    }

    // d. Emotion
    const emotionLimits = this.getParam(
      'emotionLimits',
      AI_PARAMETERS.EMOTION_LIMITS,
    );
    const priceLimits = this.getParam(
      'priceLimits',
      AI_PARAMETERS.PRICE_LIMITS,
    );
    if (emotion === 'TIRED' || emotion === 'STRESSED') {
      if (
        food.distance_km !== null &&
        food.distance_km < emotionLimits.tiredStressedNearKm
      ) {
        contextScore += 0.15;
      }
    } else if (emotion === 'REWARD') {
      if (food.price && food.price > priceLimits.rewardThreshold) {
        contextScore += 0.15;
      }
    }

    return Math.max(0.0, Math.min(1.0, contextScore));
  }
}
