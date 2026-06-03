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
  constructor(
    private readonly configService: ConfigService,
    private readonly ruleEngine: BusinessRuleEngineService,
    private readonly knowledgeService: FoodKnowledgeService,
  ) {}

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
  ): SearchResult[] {
    const currentHour = new Date().getHours();
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
      const cuisine = state.slots.cuisineType?.toLowerCase();
      if (cuisine) {
        const nameLower = food.name.toLowerCase();
        const descLower = (food.description || '').toLowerCase();
        const tagsJoined = (food.tags || []).join(' ').toLowerCase();
        const catNameLower = (food.categoryName || '').toLowerCase();

        if (nameLower.includes(cuisine) || catNameLower.includes(cuisine)) {
          intentScore = 1.0;
        } else if (
          descLower.includes(cuisine) ||
          tagsJoined.includes(cuisine)
        ) {
          intentScore = 0.8;
        } else {
          intentScore = 0.3;
        }
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
        currentHour,
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

      // Calculate final composite score
      const finalScore =
        intentScore * weights.intent +
        embeddingScore * weights.embedding +
        distanceScore * weights.distance +
        priceScore * weights.price +
        ratingScore * weights.rating +
        contextScore * weights.context +
        feedbackBoost;

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
