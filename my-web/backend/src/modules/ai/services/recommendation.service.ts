import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorRepository, SearchResult } from '../vector.repository';
import { RerankingService } from './reranking.service';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { AI_PARAMETERS } from '../constants/ai-parameters.constant';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly vectorRepository: VectorRepository,
    private readonly rerankingService: RerankingService,
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
  ): Promise<{ foods: SearchResult[]; shouldRecommend: boolean }> {
    const dbDistrict =
      district && district !== 'Vị trí GPS hiện tại' ? district : undefined;
    const dbCity = city ? city : undefined;

    // 1. Thực hiện Hybrid Search tìm candidates
    let rawFoods = await this.vectorRepository.hybridSearch(
      userVector,
      userLat,
      userLng,
      30,
      dbCity,
      dbDistrict,
      state.slots.category || 'ALL',
    );

    // Fallback tìm kiếm toàn quốc nếu không có món phù hợp tại địa phương
    if (rawFoods.length === 0 && (dbCity || dbDistrict)) {
      rawFoods = await this.vectorRepository.hybridSearch(
        userVector,
        userLat,
        userLng,
        30,
        undefined,
        undefined,
        state.slots.category || 'ALL',
      );
    }

    // 2. Chạy Reranking
    const reRanked = this.rerankingService.contextReranking(
      rawFoods,
      state,
      userLat,
      userLng,
      weather,
    );

    // 3. Đánh giá tính tương thích của món ăn theo cấu hình tập trung
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

    // Quyết định đề xuất món ăn
    const shouldRecommend = matchedFoods.length > 0 || hasDirectIntentMatch;

    let foods: SearchResult[] = [];
    if (shouldRecommend) {
      foods = matchedFoods;
      if (foods.length === 0 && reRanked.length > 0) {
        foods = reRanked.slice(0, 3);
      }
    }

    return {
      foods,
      shouldRecommend,
    };
  }
}
