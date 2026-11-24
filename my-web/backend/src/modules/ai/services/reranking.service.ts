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
import {
  expandAllergens,
  stripVietnameseDiacritics,
} from '../constants/allergen-ontology.constant';

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
    nướng: [
      'nướng',
      'bbq',
      'sườn',
      'ba chỉ',
      'thịt nướng',
      'bò nướng',
      'dẻ sườn',
      'king nướng',
      'gogi',
      'yakiniku',
      'nem nướng',
    ],
    'đồ nướng': [
      'nướng',
      'bbq',
      'sườn',
      'ba chỉ',
      'thịt nướng',
      'bò nướng',
      'dẻ sườn',
      'king nướng',
      'gogi',
      'yakiniku',
      'nem nướng',
    ],
    bbq: [
      'nướng',
      'bbq',
      'sườn',
      'ba chỉ',
      'thịt nướng',
      'bò nướng',
      'dẻ sườn',
      'king nướng',
      'gogi',
      'yakiniku',
      'nem nướng',
    ],
    lẩu: [
      'lẩu',
      'hotpot',
      'haidilao',
      'manwah',
      'kichi',
      'nhúng lẩu',
      'lẩu thái',
    ],
    chay: [
      'chay',
      'thanh tịnh',
      'thanh đạm',
      'nấm',
      'đậu hũ',
      'rau củ',
      'thực dưỡng',
      'ưu đàm',
      'tâm đức',
      'hủ tiếu chay',
    ],
    'ăn chay': [
      'chay',
      'thanh tịnh',
      'thanh đạm',
      'nấm',
      'đậu hũ',
      'rau củ',
      'thực dưỡng',
      'ưu đàm',
      'tâm đức',
      'hủ tiếu chay',
    ],
    gym: [
      'salad',
      'ức gà',
      'poke',
      'cá hồi',
      'healthy',
      'eat clean',
      'protein',
      'giảm cân',
      'tăng cơ',
      'bếp xanh',
      'detox',
    ],
    'tập gym': [
      'salad',
      'ức gà',
      'poke',
      'cá hồi',
      'healthy',
      'eat clean',
      'protein',
      'giảm cân',
      'tăng cơ',
      'bếp xanh',
      'detox',
    ],
    healthy: [
      'salad',
      'ức gà',
      'poke',
      'cá hồi',
      'healthy',
      'eat clean',
      'protein',
      'giảm cân',
      'tăng cơ',
      'bếp xanh',
      'detox',
    ],
    'eat clean': [
      'salad',
      'ức gà',
      'poke',
      'cá hồi',
      'healthy',
      'eat clean',
      'protein',
      'giảm cân',
      'tăng cơ',
      'bếp xanh',
      'detox',
    ],
    'giảm cân': [
      'salad',
      'ức gà',
      'poke',
      'cá hồi',
      'healthy',
      'eat clean',
      'protein',
      'giảm cân',
      'bếp xanh',
      'detox',
    ],
    'tăng cơ': [
      'ức gà',
      'bò',
      'thịt bò',
      'trứng',
      'protein',
      'poke',
      'cá hồi',
      'bếp xanh',
    ],
    'dân tộc': [
      'thịt trâu',
      'lợn mán',
      'gác bếp',
      'măng',
      'cơm lam',
      'thắng cố',
      'vùng cao',
      'tây bắc',
      'bún đậu',
      'bún mắm',
      'chả cá',
      'đặc sản',
    ],
    'đặc sản': [
      'phở lò đúc',
      'bún chả',
      'bún đậu mắm tôm',
      'bún bò huế',
      'bánh xèo',
      'bánh xèo miền tây',
      'chả cá lã vọng',
      'mì quảng',
      'bún cá cay',
      'bún mắm',
      'cơm niêu',
    ],
    'vùng miền': [
      'miền bắc',
      'miền trung',
      'miền nam',
      'miền tây',
      'hà nội',
      'huế',
      'sài gòn',
      'bún bò huế',
      'bánh xèo',
      'chả cá lã vọng',
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
        msgLower.includes('chiều nay') ||
        msgLower.includes('bữa chiều') ||
        msgLower.includes('ăn chiều') ||
        msgLower.includes('xế chiều') ||
        msgLower.includes('bữa xế') ||
        msgLower.includes('buổi chiều')
      ) {
        hour = 16;
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

      // 2. Intent Score (mismatched cuisine penalized, neutral 0.55 if undefined to prevent false 100% matches)
      let intentScore = 0.55;
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

      // 8.6. Common-sense Dining Sanity Check:
      // Penalize:
      // - Pure toppings / bare ingredients (e.g. Pate nóng bare plate, rau sống, topping thịt thêm, quẩy)
      // - Raw BBQ items or hotpot toppings at grill/hotpot restaurants (cannot dine on 1 raw meat plate alone)
      // - Drinks or desserts when user is hungry or asking for savory meals ("món mặn")
      // - Rejected restaurants / BBQ venues when user complains or objects
      let diningSanityAdjust = 0.0;
      const msgText = (message || '').toLowerCase();
      const isHungry =
        msgText.includes('đói') ||
        msgText.includes('ăn nhanh') ||
        msgText.includes('lót dạ') ||
        msgText.includes('chưa ăn gì');
      const isSingleOrLowBudget =
        (state.slots.budget && state.slots.budget <= 70000) ||
        state.slots.companion === 'SINGLE';

      const foodNameLower = food.name.toLowerCase();
      const restaurantNameLower = (food.restaurantName || '').toLowerCase();

      const catNameLower = (food.categoryName || '').toLowerCase();

      // Pure toppings, bare side dishes, condiments
      const isPureToppingOrIngredient =
        catNameLower.includes('ăn kèm') ||
        foodNameLower.startsWith('pate') ||
        foodNameLower.includes('topping') ||
        foodNameLower.includes('rau sống') ||
        foodNameLower.includes('bổ sung') ||
        foodNameLower.includes('thêm') ||
        foodNameLower.includes('quẩy') ||
        foodNameLower.includes('tiết luộc') ||
        foodNameLower.includes('trứng non');

      if (
        isPureToppingOrIngredient &&
        !msgText.includes('pate') &&
        !msgText.includes('topping') &&
        !msgText.includes('ăn kèm') &&
        !msgText.includes('quẩy')
      ) {
        diningSanityAdjust -= 1.0; // Triệt tiêu đồ ăn kèm / topping khi khách không chủ đích gọi
      }

      // Savory meal vs Sweet desserts or drinks
      const isExplicitSweetOrDessertRequest =
        msgText.includes('tráng miệng') ||
        msgText.includes('thèm ngọt') ||
        msgText.includes('món ngọt') ||
        msgText.includes('đồ ngọt') ||
        msgText.includes('chè') ||
        msgText.includes('kem') ||
        msgText.includes('caramen') ||
        msgText.includes('bánh ngọt') ||
        msgText.includes('sữa chua') ||
        msgText.includes('ăn vặt') ||
        (state.slots.cuisineType || '').toLowerCase().includes('ngọt');

      const isExplicitDrinkRequest =
        msgText.includes('uống gì') ||
        msgText.includes('đồ uống') ||
        msgText.includes('nước uống') ||
        msgText.includes('cà phê') ||
        msgText.includes('cafe') ||
        msgText.includes('trà sữa') ||
        msgText.includes('giải khát') ||
        msgText.includes('nước ngọt') ||
        msgText.includes('nước mát') ||
        state.slots.category === 'DRINK';

      const isDrink =
        catNameLower.includes('đồ uống') ||
        catNameLower.includes('giải khát') ||
        catNameLower.includes('nước mát') ||
        catNameLower.includes('trà') ||
        catNameLower.includes('sữa đậu') ||
        catNameLower.includes('trà thảo mộc') ||
        catNameLower.includes('bia') ||
        catNameLower.includes('nước chua') ||
        foodNameLower.includes('sữa') ||
        foodNameLower.includes('trà') ||
        foodNameLower.includes('nước ngọt') ||
        foodNameLower.includes('nước ép') ||
        foodNameLower.includes('nước mía') ||
        foodNameLower.includes('cà phê') ||
        foodNameLower.includes('cafe') ||
        foodNameLower.includes('sinh tố') ||
        foodNameLower.includes('rau má') ||
        foodNameLower.includes('đá bào') ||
        foodNameLower.includes('nước dừa') ||
        foodNameLower.includes('cốt tắc') ||
        foodNameLower.includes('đá lạnh');

      const isSweetOrDessert =
        catNameLower.includes('tráng miệng') ||
        foodNameLower.includes('chè') ||
        foodNameLower.includes('caramen') ||
        foodNameLower.includes('thạch') ||
        foodNameLower.includes('kem') ||
        foodNameLower.includes('trà sữa') ||
        foodNameLower.includes('bánh ngọt') ||
        foodNameLower.includes('bingsu') ||
        foodNameLower.includes('pudding') ||
        foodNameLower.includes('flan') ||
        foodNameLower.includes('sữa chua') ||
        foodNameLower.includes('tào phớ') ||
        foodNameLower.includes('hoa quả dầm') ||
        foodNameLower.includes('bánh mousse') ||
        foodNameLower.includes('bánh tart') ||
        foodNameLower.includes('bánh su') ||
        foodNameLower.includes('bánh crepe') ||
        foodNameLower.includes('trái cây');

      const isCompleteMeal =
        foodNameLower.includes('bánh mì chảo') ||
        foodNameLower.includes('bánh mì') ||
        foodNameLower.includes('cơm') ||
        foodNameLower.includes('phở') ||
        foodNameLower.includes('bún') ||
        foodNameLower.includes('miến') ||
        foodNameLower.includes('hủ tiếu') ||
        foodNameLower.includes('mì') ||
        foodNameLower.includes('xôi') ||
        foodNameLower.includes('pizza') ||
        foodNameLower.includes('burger') ||
        foodNameLower.includes('cháo') ||
        foodNameLower.includes('lẩu') ||
        foodNameLower.includes('nướng') ||
        foodNameLower.includes('sườn') ||
        foodNameLower.includes('gà') ||
        foodNameLower.includes('bò') ||
        foodNameLower.includes('vịt') ||
        foodNameLower.includes('ngan') ||
        foodNameLower.includes('hải sản') ||
        foodNameLower.includes('salad') ||
        foodNameLower.includes('poke') ||
        foodNameLower.includes('chay') ||
        foodNameLower.includes('nem');

      if (isExplicitSweetOrDessertRequest) {
        if (isSweetOrDessert) {
          diningSanityAdjust += 0.4;
        } else if (isCompleteMeal) {
          diningSanityAdjust -= 0.3;
        }
      } else if (isExplicitDrinkRequest) {
        if (isDrink) {
          diningSanityAdjust += 0.4;
        } else if (isCompleteMeal) {
          diningSanityAdjust -= 0.3;
        }
      } else {
        // MẶC ĐỊNH CHO TẤT CẢ CÁC YÊU CẦU ĂN UỐNG / TÌM MÓN BÌNH THƯỜNG / KHI ĐÓI:
        // Ưu tiên món ăn chính no bụng hoàn chỉnh, TRIỆT TIÊU tráng miệng và đồ uống!
        if (isSweetOrDessert) {
          diningSanityAdjust -= 1.0; // Triệt tiêu món tráng miệng khi khách tìm món ăn thông thường
        }
        if (isDrink) {
          diningSanityAdjust -= 1.0; // Triệt tiêu đồ uống khi khách tìm món ăn thông thường
        }
        if (isCompleteMeal && !isPureToppingOrIngredient) {
          diningSanityAdjust += 0.25; // Ưu tiên hàng đầu cho bữa ăn chính no bụng hoàn chỉnh
        }
      }

      // Check explicit BBQ craving vs objection
      const isExplicitBbqRequest =
        msgText.includes('đồ nướng') ||
        msgText.includes('thịt nướng') ||
        msgText.includes('thèm nướng') ||
        msgText.includes('thèm đồ nướng') ||
        (msgText.includes('quán nướng') &&
          !msgText.includes('chẳng lẽ') &&
          !msgText.includes('gọi món mà')) ||
        (state.slots.cuisineType || '').toLowerCase().includes('nướng') ||
        (state.slots.cuisineType || '').toLowerCase().includes('bbq');

      const isBbqRestaurant =
        restaurantNameLower.includes('nướng') ||
        restaurantNameLower.includes('bbq') ||
        restaurantNameLower.includes('gogi') ||
        restaurantNameLower.includes('lẩu') ||
        restaurantNameLower.includes('k-pub') ||
        restaurantNameLower.includes('sumo') ||
        restaurantNameLower.includes('haidilao') ||
        restaurantNameLower.includes('manwah');

      const isBbqFood =
        foodNameLower.includes('nướng') ||
        foodNameLower.includes('bbq') ||
        foodNameLower.includes('sườn') ||
        foodNameLower.includes('ba chỉ') ||
        foodNameLower.includes('bò ướp') ||
        foodNameLower.includes('dẻ sườn') ||
        (isBbqRestaurant && !isDrink && !isPureToppingOrIngredient);

      if (isExplicitBbqRequest) {
        if (isDrink) {
          diningSanityAdjust -= 0.85; // Extreme penalty: NEVER recommend a drink when user asks for BBQ!
        }
        if (isBbqFood) {
          diningSanityAdjust += 0.45; // Massive boost for actual BBQ meat dishes!
        }
      } else {
        // User objection / complaint against BBQ / grill or specific venue
        const userObjectsToBbq =
          msgText.includes('quán nướng') ||
          msgText.includes('1 khay') ||
          msgText.includes('khay sườn') ||
          msgText.includes('gọi món mà') ||
          msgText.includes('chẳng lẽ') ||
          msgText.includes('ai lại ăn');

        const isGrillOrRawPlate =
          foodNameLower.includes('sườn') ||
          foodNameLower.includes('ba chỉ') ||
          foodNameLower.includes('thịt nướng') ||
          foodNameLower.includes('khay') ||
          foodNameLower.includes('bò ướp') ||
          foodNameLower.includes('nhúng lẩu');

        if (userObjectsToBbq && isBbqRestaurant) {
          diningSanityAdjust -= 0.8; // Exclude BBQ completely when user specifically complains about BBQ!
        } else if (isHungry || isSingleOrLowBudget) {
          if (isBbqRestaurant && isGrillOrRawPlate) {
            diningSanityAdjust -= 0.45; // Don't suggest single raw grill plate to hungry/single diner
          }
        }
      }

      // Check explicit Chay (Vegetarian) request
      const isExplicitChayRequest =
        msgText.includes('chay') ||
        msgText.includes('thanh tịnh') ||
        msgText.includes('thanh đạm') ||
        msgText.includes('không ăn thịt') ||
        (state.slots.cuisineType || '').toLowerCase().includes('chay');

      const isChayFood =
        foodNameLower.includes('chay') ||
        catNameLower.includes('chay') ||
        restaurantNameLower.includes('chay');

      if (isExplicitChayRequest) {
        if (isChayFood) {
          diningSanityAdjust += 0.55; // Boost vegetarian food
        } else {
          diningSanityAdjust -= 0.6; // Penalize meat dishes when asking for vegetarian
        }
      }

      // Check explicit Gym / Healthy request
      const isExplicitGymRequest =
        msgText.includes('gym') ||
        msgText.includes('tập gym') ||
        msgText.includes('healthy') ||
        msgText.includes('eat clean') ||
        msgText.includes('giảm cân') ||
        msgText.includes('tăng cơ') ||
        msgText.includes('protein') ||
        (state.slots.cuisineType || '').toLowerCase().includes('gym') ||
        (state.slots.cuisineType || '').toLowerCase().includes('healthy');

      const isGymFood =
        foodNameLower.includes('salad') ||
        foodNameLower.includes('ức gà') ||
        foodNameLower.includes('poke') ||
        foodNameLower.includes('cá hồi') ||
        restaurantNameLower.includes('healthy') ||
        restaurantNameLower.includes('bếp xanh');

      if (isExplicitGymRequest) {
        if (isGymFood) {
          diningSanityAdjust += 0.55; // Boost healthy/gym food
        }
      }

      // 8.7. Xử lý Dislikes (những món, vị, nguyên liệu người dùng không thích hoặc kiêng)
      if (state.slots.dislikes && state.slots.dislikes.length > 0) {
        const foodFullText = `${foodNameLower} ${(food.description || '').toLowerCase()} ${(food.tags || []).join(' ').toLowerCase()} ${catNameLower}`;
        const hasDislikedItem = state.slots.dislikes.some((dislike) => {
          const cleanDislike = dislike.toLowerCase().trim();
          return (
            cleanDislike.length >= 2 && foodFullText.includes(cleanDislike)
          );
        });
        if (hasDislikedItem) {
          diningSanityAdjust -= 0.55; // Phạt nặng món chứa thành phần/hương vị khách không thích
        }
      }

      // 8.8. Xử lý Persona thích ứng theo đối tượng người dùng
      const persona = state.slots.persona;
      if (
        persona === 'PREGNANT' ||
        msgText.includes('bầu') ||
        msgText.includes('mang thai')
      ) {
        const isRawOrCold =
          foodNameLower.includes('sushi') ||
          foodNameLower.includes('sashimi') ||
          foodNameLower.includes('gỏi') ||
          foodNameLower.includes('tái') ||
          foodNameLower.includes('tiết canh') ||
          foodNameLower.includes('đồ sống');
        const isNutritiousSoup =
          foodNameLower.includes('cháo') ||
          foodNameLower.includes('hầm') ||
          foodNameLower.includes('canh') ||
          foodNameLower.includes('súp') ||
          foodNameLower.includes('bồ câu') ||
          foodNameLower.includes('gà hầm') ||
          foodNameLower.includes('cá chép');
        if (isRawOrCold) {
          diningSanityAdjust -= 0.85; // Cấm tiệt đồ tươi sống cho phụ nữ mang thai
        } else if (isNutritiousSoup) {
          diningSanityAdjust += 0.45; // Ưu tiên tối đa món bổ dưỡng ấm nóng
        }
      } else if (persona === 'GYM') {
        if (isGymFood) {
          diningSanityAdjust += 0.45; // Ưu tiên món giàu đạm sạch cho dân tập gym
        }
      } else if (persona === 'STUDENT') {
        if (food.price <= 45000 && isCompleteMeal) {
          diningSanityAdjust += 0.35; // Ưu tiên món no bụng giá sinh viên
        }
      } else if (persona === 'WELLNESS') {
        const isWarmSoft =
          foodNameLower.includes('cháo') ||
          foodNameLower.includes('súp') ||
          foodNameLower.includes('canh') ||
          foodNameLower.includes('dưỡng sinh');
        if (isWarmSoft) {
          diningSanityAdjust += 0.4; // Ưu tiên món mềm, nhẹ bụng, ấm nóng
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
        emotionPriceAdjust +
        diningSanityAdjust;

      return {
        ...food,
        similarity: Number(Math.max(0.0, finalScore).toFixed(4)),
      };
    });

    // If intent is FIND_NEARBY, sort strictly by distance ascending among valid candidates (similarity > 0)
    // to prevent disqualified desserts/drinks or rejected foods from floating to the top
    if (intent === FoodIntent.FIND_NEARBY) {
      const validNearby = reRanked.filter((f) => f.similarity > 0.0);
      if (validNearby.length > 0) {
        return validNearby.sort(
          (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
        );
      }
      return reRanked.sort(
        (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
      );
    }

    return reRanked.sort((a, b) => b.similarity - a.similarity);
  }

  private hasAllergens(food: SearchResult, allergies?: string[]): boolean {
    if (!allergies || allergies.length === 0) return false;

    // Sử dụng Bản đồ Tri thức Dị ứng Thực phẩm & Dị ứng Chéo (Ontology)
    // Tự động mở rộng từ đồng nghĩa và nguy cơ dị ứng chéo (ví dụ: dị ứng tôm -> loại trừ cả bề bề, mắm tôm, cua, ghẹ)
    const { searchKeywords } = expandAllergens(allergies);
    if (searchKeywords.length === 0) return false;

    const nameLower = stripVietnameseDiacritics(food.name);
    const descLower = stripVietnameseDiacritics(food.description || '');
    const tagsLower = (food.tags || []).map((t) =>
      stripVietnameseDiacritics(t),
    );
    const catLower = stripVietnameseDiacritics(food.categoryName || '');
    const restaurantLower = stripVietnameseDiacritics(
      food.restaurantName || '',
    );

    return searchKeywords.some((keyword) => {
      if (!keyword || keyword.length < 2) return false;

      // Với các từ khóa ngắn (<= 3 ký tự như "ca", "so", "oc"), dùng regex word boundary để tránh bắt nhầm (như "cà phê", "sốt")
      if (keyword.length <= 3) {
        const regex = new RegExp(
          `(^|\\s|[-_.,/])${keyword}($|\\s|[-_.,/])`,
          'i',
        );
        if (
          regex.test(nameLower) ||
          regex.test(descLower) ||
          regex.test(catLower)
        ) {
          return true;
        }
        return tagsLower.some((t) => regex.test(t));
      }

      // Kiểm tra trong tên món, mô tả, danh mục, tên quán và thẻ tags
      if (nameLower.includes(keyword)) return true;
      if (descLower.includes(keyword)) return true;
      if (catLower.includes(keyword)) return true;
      if (restaurantLower.includes(keyword)) return true;
      return tagsLower.some((t) => t.includes(keyword));
    });
  }
}
