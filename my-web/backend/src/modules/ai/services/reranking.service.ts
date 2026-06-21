/**
 * Mục đích: Service chấm điểm lại (Reranking) các món ăn dựa trên GPS, thời tiết, dị ứng, quy tắc nghiệp vụ và feedback học được.
 * File quan hệ: Được gọi bởi RecommendationService.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchResult } from '../vector.repository';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { AI_PARAMETERS } from '../constants/ai-parameters.constant';
import { BusinessRuleEngineService } from './business-rule-engine.service';
import { FoodKnowledgeService } from './food-knowledge.service';
import { FoodIntent } from '../constants/food-intent.enum';

interface RerankingWeights {
  intent: number;
  embedding: number;
  distance: number;
  price: number;
  rating: number;
  context: number;
}

@Injectable()
export class RerankingService {
  private readonly CUISINE_KEYWORDS: Record<string, string[]> = {
    'việt nam': [
      'bún',
      'phở',
      'xôi',
      'nem',
      'cháo',
      'nộm',
      'bánh mì',
      'cơm thố',
      'bánh bột lọc',
      'trà',
      'chè',
      'đậu mắm tôm',
      'ngan',
    ],
    vietnamese: [
      'bún',
      'phở',
      'xôi',
      'nem',
      'cháo',
      'nộm',
      'bánh mì',
      'cơm thố',
      'bánh bột lọc',
      'trà',
      'chè',
      'đậu mắm tôm',
      'ngan',
    ],
    'hàn quốc': [
      'hàn quốc',
      'kimbap',
      'tokbokki',
      'kim chi',
      'mì cay',
      'nướng hàn',
      'tok',
      'gà sốt hs',
      'tteokbokki',
    ],
    korean: [
      'hàn quốc',
      'kimbap',
      'tokbokki',
      'kim chi',
      'mì cay',
      'nướng hàn',
      'tok',
      'gà sốt hs',
      'tteokbokki',
    ],
    'nhật bản': [
      'nhật bản',
      'sushi',
      'sashimi',
      'ramen',
      'udon',
      'tempura',
      'takoyaki',
      'mì soba',
    ],
    japanese: [
      'nhật bản',
      'sushi',
      'sashimi',
      'ramen',
      'udon',
      'tempura',
      'takoyaki',
      'mì soba',
    ],
    'âu mỹ': [
      'âu mỹ',
      'pizza',
      'burger',
      'spaghetti',
      'pasta',
      'steak',
      'khoai tây chiên',
      'french fries',
      'deli',
      'hamburger',
      'lotteria',
      'domino',
    ],
    western: [
      'âu mỹ',
      'pizza',
      'burger',
      'spaghetti',
      'pasta',
      'steak',
      'khoai tây chiên',
      'french fries',
      'deli',
      'hamburger',
      'lotteria',
      'domino',
    ],
  };

  constructor(
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly configService: ConfigService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly ruleEngine: BusinessRuleEngineService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly knowledgeService: FoodKnowledgeService,
  ) {}

  /**
   * Tính toán điểm suy hao khoảng cách dựa trên business rule engine.
   * Phục vụ tương thích ngược và unit test.
   * @param distanceKm Khoảng cách (km)
   */
  calculateDistanceScore(distanceKm: number | null): number {
    return this.ruleEngine.getDistanceScore(distanceKm);
  }

  /**
   * Tính toán điểm ngân sách dựa trên business rule engine.
   * Phục vụ tương thích ngược và unit test.
   * @param food Món ăn ứng viên
   * @param budget Ngân sách tối đa của khách
   */
  calculatePriceScore(food: SearchResult, budget?: number): number {
    return this.ruleEngine.getPriceScore(food.price, budget);
  }

  /**
   * Tính toán điểm so khớp ý định (intent match score).
   * Phục vụ tương thích ngược và unit test.
   * @param food Món ăn ứng viên
   * @param cuisine Ý định món ăn cần tìm
   */
  calculateIntentScore(food: SearchResult, cuisine: string): number {
    const cuisineLower = cuisine.toLowerCase().trim();
    const nameLower = food.name.toLowerCase();
    const descLower = (food.description || '').toLowerCase();
    const tagsJoined = (food.tags || []).join(' ').toLowerCase();
    const catNameLower = (food.categoryName || '').toLowerCase();

    // 1. Check exact string match
    if (
      nameLower.includes(cuisineLower) ||
      catNameLower.includes(cuisineLower)
    ) {
      return 1.0;
    }

    // 2. Check general regional cuisine styles using synonyms/keywords
    for (const [key, keywords] of Object.entries(this.CUISINE_KEYWORDS)) {
      if (cuisineLower.includes(key) || key.includes(cuisineLower)) {
        const isMatch = keywords.some(
          (kw) =>
            nameLower.includes(kw) ||
            catNameLower.includes(kw) ||
            descLower.includes(kw) ||
            tagsJoined.includes(kw),
        );
        if (isMatch) {
          return 1.0;
        }
      }
    }

    // 3. Check indirect description/tags match
    if (descLower.includes(cuisineLower) || tagsJoined.includes(cuisineLower)) {
      return 0.8;
    }

    return 0.3;
  }

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  contextReranking(
    candidates: SearchResult[],
    state: DialogueState,
    userLat?: number,
    userLng?: number,
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
    currentHour?: number,
  ): SearchResult[] {
    let hour = currentHour !== undefined ? currentHour : new Date().getHours();

    // Tự động nhận diện khoảng thời gian được hỏi trong tin nhắn để định hướng gợi ý
    if (message) {
      const msgLower = message.toLowerCase();
      if (
        msgLower.includes('sáng mai') ||
        msgLower.includes('sáng nay') ||
        msgLower.includes('bữa sáng') ||
        msgLower.includes('ăn sáng')
      ) {
        hour = 8;
      } else if (
        msgLower.includes('trưa nay') ||
        msgLower.includes('trưa mai') ||
        msgLower.includes('bữa trưa') ||
        msgLower.includes('ăn trưa')
      ) {
        hour = 12;
      } else if (
        msgLower.includes('tối nay') ||
        msgLower.includes('tối mai') ||
        msgLower.includes('bữa tối') ||
        msgLower.includes('ăn tối') ||
        msgLower.includes('chiều tối')
      ) {
        hour = 19;
      } else if (
        msgLower.includes('đêm nay') ||
        msgLower.includes('ăn đêm') ||
        msgLower.includes('khuya') ||
        msgLower.includes('đêm muộn')
      ) {
        hour = 23;
      }
    }
    const temp = weather?.temperature ?? 28;
    const isRaining = weather?.isRaining ?? false;

    // Filter out candidates containing allergens completely
    const safeCandidates = candidates.filter(
      (food) => !this.hasAllergens(food, state.slots.allergies),
    );

    // Load base weights
    const baseWeights = this.getParam<RerankingWeights>(
      'weights',
      AI_PARAMETERS.WEIGHTS,
    );
    const weights = { ...baseWeights };

    // Dynamically adjust weights if priority needs are analyzed by LLM
    if (needs) {
      if (needs.distance !== undefined)
        weights.distance = needs.distance * 0.35;
      if (needs.price !== undefined) weights.price = needs.price * 0.25;
      if (needs.cuisine !== undefined) weights.intent = needs.cuisine * 0.45;
      if (needs.emotion !== undefined || needs.weather !== undefined) {
        weights.context =
          Math.max(needs.emotion || 0, needs.weather || 0) * 0.2;
      }

      // Normalize weights
      const total =
        weights.intent +
        weights.embedding +
        weights.distance +
        weights.price +
        weights.rating +
        weights.context;
      if (total > 0) {
        weights.intent /= total;
        weights.embedding /= total;
        weights.distance /= total;
        weights.price /= total;
        weights.rating /= total;
        weights.context /= total;
      }
    }

    // Check if there is wellness advice that should boost specific foods
    let wellnessTargets: string[] = [];
    if (message) {
      const wellness = this.knowledgeService.getWellnessAdvice(message);
      if (wellness) {
        wellnessTargets = wellness.targetCuisines;
      }
    }

    const reRanked = safeCandidates.map((food) => {
      // 1. Exclude foods in rejected list
      if (state.rejected_food_ids.includes(Number(food.id))) {
        return { ...food, similarity: 0.0 };
      }

      // 2. Intent Score (mismatched cuisine penalized, neutral if undefined)
      let intentScore = 1.0;
      const cuisine = state.slots.cuisineType;
      if (cuisine) {
        intentScore = this.calculateIntentScore(food, cuisine);
      }

      // 3. Embedding similarity score
      const embeddingScore = food.embeddingSimilarity || 0.0;

      // 4. Distance score (computed via Rule Engine)
      const distanceScore = this.ruleEngine.getDistanceScore(
        food.distance_km,
        state.slots.mobility,
      );

      // 5. Price score (computed via Rule Engine)
      const priceScore = this.ruleEngine.getPriceScore(
        food.price,
        state.slots.budget,
      );

      // 6. Rating score
      const defaultValues = this.getParam(
        'defaultValues',
        AI_PARAMETERS.DEFAULT_VALUES,
      );
      const ratingScore = defaultValues.rerankingDefaultRating;

      // 7. Context score (Time & Weather boosts computed via Rule Engine)
      const timeBoost = this.ruleEngine.getTimeBoost(
        food.name,
        food.categoryName,
        food.tags,
        hour,
      );
      const weatherBoost = this.ruleEngine.getWeatherBoost(
        food.name,
        food.categoryName,
        food.tags,
        temp,
        isRaining,
      );

      let wellnessBoost = 0.0;
      if (wellnessTargets.length > 0) {
        const nameDesc =
          `${food.name} ${food.description || ''} ${food.categoryName || ''}`.toLowerCase();
        const isWellnessMatch = wellnessTargets.some((target) =>
          nameDesc.includes(target.toLowerCase()),
        );
        if (isWellnessMatch) {
          wellnessBoost = 0.25;
        }
      }

      const contextScore = Math.max(
        0.0,
        Math.min(1.0, 0.5 + timeBoost + weatherBoost + wellnessBoost),
      );

      // 8. Apply AI Feedback Learning boosts/penalties
      let feedbackBoost = 0.0;
      if (feedbackProfile) {
        const nameLower = food.name.toLowerCase();
        const catNameLower = (food.categoryName || '').toLowerCase();

        const isLikedFood = feedbackProfile.likedFoods.some((liked) =>
          nameLower.includes(liked.toLowerCase()),
        );
        const isLikedCategory = feedbackProfile.likedCategories.some(
          (likedCat) => catNameLower.includes(likedCat.toLowerCase()),
        );

        if (isLikedFood || isLikedCategory) {
          feedbackBoost += 0.15;
        }

        const isDislikedFood = feedbackProfile.dislikedFoods.some((disliked) =>
          nameLower.includes(disliked.toLowerCase()),
        );
        const isDislikedCategory = feedbackProfile.dislikedCategories.some(
          (dislikedCat) => catNameLower.includes(dislikedCat.toLowerCase()),
        );

        if (isDislikedFood || isDislikedCategory) {
          feedbackBoost -= 0.2;
        }
      }

      // 8.5. Emotion REWARD (luxury) price adjustments
      let emotionPriceAdjust = 0.0;
      if (state.slots.emotion === 'REWARD') {
        const priceLimits = this.getParam<typeof AI_PARAMETERS.PRICE_LIMITS>(
          'priceLimits',
          AI_PARAMETERS.PRICE_LIMITS,
        );
        const rewardThreshold = priceLimits?.rewardThreshold ?? 80000;
        if (food.price < rewardThreshold) {
          emotionPriceAdjust = -0.3; // Heavy penalty for cheap food when trying to eat luxuriously
        } else {
          emotionPriceAdjust = 0.15; // Boost premium food options
        }
      }

      // Calculate final composite score
      const finalScore =
        intentScore * weights.intent +
        embeddingScore * weights.embedding +
        distanceScore * weights.distance +
        priceScore * weights.price +
        ratingScore * weights.rating +
        contextScore * weights.context +
        feedbackBoost +
        emotionPriceAdjust;

      return {
        ...food,
        similarity: Number(Math.max(0.0, finalScore).toFixed(4)),
      };
    });

    // If intent is FIND_NEARBY, sort strictly by distance ascending
    if (intent === FoodIntent.FIND_NEARBY) {
      return reRanked.sort(
        (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
      );
    }

    return reRanked.sort((a, b) => b.similarity - a.similarity);
  }

  private hasAllergens(food: SearchResult, allergies?: string[]): boolean {
    if (!allergies || allergies.length === 0) return false;

    const stripDiacritics = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .toLowerCase();
    };

    const nameLower = stripDiacritics(food.name);
    const descLower = stripDiacritics(food.description || '');
    const tagsLower = (food.tags || []).map((t) => stripDiacritics(t));
    const catLower = stripDiacritics(food.categoryName || '');
    const restaurantLower = stripDiacritics(food.restaurantName || '');

    return allergies.some((allergy) => {
      const cleanAllergy = stripDiacritics(allergy).trim();
      if (!cleanAllergy) return false;

      // Check name, description, tags, category, restaurant name
      if (nameLower.includes(cleanAllergy)) return true;
      if (descLower.includes(cleanAllergy)) return true;
      if (catLower.includes(cleanAllergy)) return true;
      if (restaurantLower.includes(cleanAllergy)) return true;
      if (tagsLower.some((t) => t.includes(cleanAllergy))) return true;

      // Special case: if allergy is "đậu phộng", check synonym "lac"
      if (cleanAllergy === 'dau phong' || cleanAllergy === 'lac') {
        if (
          nameLower.includes('dau phong') ||
          nameLower.includes('lac') ||
          descLower.includes('dau phong') ||
          descLower.includes('lac') ||
          tagsLower.some((t) => t.includes('dau phong') || t.includes('lac'))
        ) {
          return true;
        }
      }

      // Special case: if allergy is "hai san", check common seafood terms
      if (cleanAllergy === 'hai san') {
        const seafoodTerms = [
          'tom',
          'cua',
          'muc',
          'oc',
          'ca',
          'so',
          'hen',
          'ngheu',
        ];
        if (
          seafoodTerms.some(
            (term) =>
              nameLower.includes(term) ||
              descLower.includes(term) ||
              tagsLower.some((t) => t.includes(term)),
          )
        ) {
          return true;
        }
      }

      return false;
    });
  }
}
