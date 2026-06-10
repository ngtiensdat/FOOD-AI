/**
 * Mục đích: Service đánh giá các quy tắc nghiệp vụ F&B (ngân sách, khoảng cách, companion, emotion) để chấm điểm đề xuất.
 * File quan hệ: Được gọi bởi RerankingService để tinh chỉnh trọng số gợi ý.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AI_RULES } from '../constants/ai-rules.constant';

@Injectable()
export class BusinessRuleEngineService {
  private readonly logger = new Logger(BusinessRuleEngineService.name);

  // Time-of-day boosts
  getTimeBoost(
    foodName: string,
    categoryName: string,
    tags: string[],
    currentHour: number,
  ): number {
    const nameAndTags =
      `${foodName} ${categoryName} ${(tags || []).join(' ')}`.toLowerCase();

    // Check morning boost
    if (currentHour >= 6 && currentHour <= 9) {
      const isMorningFood = AI_RULES.TIME_BOOSTS.MORNING.keywords.some((kw) =>
        nameAndTags.includes(kw),
      );
      if (isMorningFood) return AI_RULES.TIME_BOOSTS.MORNING.boost;
    }
    // Check lunch boost
    if (currentHour >= 11 && currentHour <= 13) {
      const isLunchFood = AI_RULES.TIME_BOOSTS.LUNCH.keywords.some((kw) =>
        nameAndTags.includes(kw),
      );
      if (isLunchFood) return AI_RULES.TIME_BOOSTS.LUNCH.boost;
    }
    // Check dinner boost
    if (currentHour >= 18 && currentHour <= 21) {
      const isDinnerFood = AI_RULES.TIME_BOOSTS.DINNER.keywords.some((kw) =>
        nameAndTags.includes(kw),
      );
      if (isDinnerFood) return AI_RULES.TIME_BOOSTS.DINNER.boost;
    }
    // Check late night boost
    if (currentHour >= 22 || currentHour <= 4) {
      const isLateNightFood = AI_RULES.TIME_BOOSTS.LATE_NIGHT.keywords.some(
        (kw) => nameAndTags.includes(kw),
      );
      if (isLateNightFood) return AI_RULES.TIME_BOOSTS.LATE_NIGHT.boost;
    }

    return 0.0;
  }

  // Weather boosts
  getWeatherBoost(
    foodName: string,
    categoryName: string,
    tags: string[],
    temp: number,
    isRaining: boolean,
  ): number {
    const nameAndTags =
      `${foodName} ${categoryName} ${(tags || []).join(' ')}`.toLowerCase();
    let boost = 0.0;

    // Check cold or raining boost
    if (temp <= AI_RULES.WEATHER_BOOSTS.COLD_TEMP_THRESHOLD || isRaining) {
      const isColdRainFood =
        AI_RULES.WEATHER_BOOSTS.COLD_OR_RAIN.boostKeywords.some((kw) =>
          nameAndTags.includes(kw),
        );
      if (isColdRainFood) {
        boost += AI_RULES.WEATHER_BOOSTS.COLD_OR_RAIN.value;
      }
    }

    // Check hot weather boost
    if (temp >= AI_RULES.WEATHER_BOOSTS.HOT_TEMP_THRESHOLD) {
      const isHotFood = AI_RULES.WEATHER_BOOSTS.HOT.boostKeywords.some((kw) =>
        nameAndTags.includes(kw),
      );
      if (isHotFood) {
        boost += AI_RULES.WEATHER_BOOSTS.HOT.value;
      }

      const isHeavyHotFood = AI_RULES.WEATHER_BOOSTS.HOT.penalizeKeywords.some(
        (kw) => nameAndTags.includes(kw),
      );
      if (isHeavyHotFood) {
        boost -= AI_RULES.WEATHER_BOOSTS.HOT.value;
      }
    }

    return boost;
  }

  // Price match score
  getPriceScore(price: number, budget?: number): number {
    if (!budget) return 1.0;
    if (price <= budget) return 1.0;
    return Math.max(0, 1 - (price - budget) / budget);
  }

  // Distance range match score based on mobility
  getDistanceScore(
    distanceKm: number | null,
    mobility?: 'LAZY' | 'NORMAL' | 'EXPLORE',
  ): number {
    if (distanceKm === null) return 1.0;

    let score = 1.0;
    // Exponential distance decay
    score = Math.max(0.5, Math.exp(-0.07 * distanceKm));

    if (mobility === 'LAZY') {
      if (distanceKm < 1.5) {
        score += 0.25;
      } else if (distanceKm > 3.0) {
        score -= 0.3;
      }
    } else if (mobility === 'EXPLORE') {
      if (distanceKm > 3.0) {
        score += 0.2;
      }
    }

    return Math.max(0.0, Math.min(1.0, score));
  }
}
