/**
 * Mục đích: Service thực hiện truy vấn và lọc thô món ăn trong CSDL dựa trên các điều kiện lọc cơ bản.
 * File quan hệ: Được gọi bởi RecommendationService để lấy các món ăn ứng cử.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { VectorRepository, SearchResult } from '../vector.repository';
import { FoodStatus } from '@prisma/client';
import { FoodIntent } from '../constants/food-intent.enum';
import { DialogueState } from '../interfaces/dialogue-state.interface';

@Injectable()
export class FoodRetrievalService {
  private readonly logger = new Logger(FoodRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorRepository: VectorRepository,
  ) {}

  async retrieveCandidates(
    userVector: number[],
    userLat?: number,
    userLng?: number,
    city?: string,
    district?: string,
    categoryFilter: 'FOOD' | 'DRINK' | 'ALL' = 'ALL',
    maxDistanceKm: number | null = null,
    intent?: FoodIntent,
    state?: DialogueState,
    message?: string,
    offset = 0,
  ): Promise<SearchResult[]> {
    const dbDistrict =
      district && district !== 'Vị trí GPS hiện tại' ? district : undefined;
    const dbCity = city ? city : undefined;

    // Check if user is asking for nearby alternatives to previously suggested foods
    let isAlternativeRequest = false;
    if (
      intent === FoodIntent.FIND_NEARBY &&
      state &&
      state.suggested_food_ids &&
      state.suggested_food_ids.length > 0 &&
      message
    ) {
      const msgLower = message.toLowerCase();
      const alternativeKeywords = [
        'khác',
        'gần hơn',
        'thay thế',
        'đổi',
        'lựa chọn',
        'chuyển',
      ];
      const hasAlternativeKeyword = alternativeKeywords.some((kw) =>
        msgLower.includes(kw),
      );

      if (hasAlternativeKeyword) {
        const lastFoodId = state.suggested_food_ids[0];
        const lastFood = await this.prisma.food.findUnique({
          where: { id: lastFoodId },
          include: { category: true },
        });

        if (lastFood) {
          const lastFoodNameLower = lastFood.name.toLowerCase();
          const lastFoodCatLower = (
            lastFood.category?.name || ''
          ).toLowerCase();

          const commonFoodNouns = [
            'xôi',
            'bún',
            'phở',
            'cơm',
            'gà',
            'pizza',
            'mì',
            'bánh',
            'trà',
            'cà phê',
            'cafe',
            'chè',
            'sữa',
            'nem',
            'lẩu',
            'nướng',
            'burger',
            'sushi',
            'cháo',
            'súp',
            'ngan',
            'vịt',
            'bò',
            'heo',
            'lợn',
            'hải sản',
          ];

          // If the message contains a food noun that is NOT in the last food's name or category name,
          // it's a new request, so we should NOT hijack it.
          const mentionsNewFood = commonFoodNouns.some((noun) => {
            if (msgLower.includes(noun)) {
              return (
                !lastFoodNameLower.includes(noun) &&
                !lastFoodCatLower.includes(noun)
              );
            }
            return false;
          });

          if (!mentionsNewFood) {
            isAlternativeRequest = true;
          }
        }
      }
    }

    if (isAlternativeRequest) {
      const lastFoodId = state!.suggested_food_ids[0];
      const lastFood = await this.prisma.food.findUnique({
        where: { id: lastFoodId },
        include: { category: true },
      });

      if (lastFood) {
        this.logger.log(
          `FIND_NEARBY alternative request detected. Finding closer alternatives for food type: ${lastFood.name} (Category ID: ${lastFood.categoryId})`,
        );

        // Find foods in the same category
        const similarFoods = await this.prisma.food.findMany({
          where: {
            status: FoodStatus.APPROVED,
            isActive: true,
            categoryId: lastFood.categoryId || undefined,
          },
          include: {
            restaurant: true,
            category: true,
          },
          take: 15,
        });

        if (similarFoods.length > 0) {
          const mappedCandidates = similarFoods.map((f) => {
            let distance_km: number | null = null;
            if (
              userLat !== undefined &&
              userLng !== undefined &&
              f.lat !== null &&
              f.lng !== null
            ) {
              distance_km =
                111.02 *
                Math.sqrt(
                  Math.pow(f.lat - userLat, 2) + Math.pow(f.lng - userLng, 2),
                );
            }

            return {
              id: f.id,
              name: f.name,
              price: f.price,
              description: f.description || '',
              image: f.image || '',
              tags: f.tags,
              restaurantName: f.restaurant?.name || '',
              address: f.address || f.restaurant?.address || '',
              lat: f.lat || 0,
              lng: f.lng || 0,
              categoryName: f.category?.name || '',
              embeddingSimilarity: 0.7, // Set high embedding similarity because it matches category perfectly
              distance_km,
              similarity: 0.7,
            };
          });

          return mappedCandidates;
        }
      }
    }

    // 1. Local RAG Hybrid Search
    let candidates = await this.vectorRepository.hybridSearch(
      userVector,
      userLat,
      userLng,
      30,
      dbCity,
      dbDistrict,
      categoryFilter,
      maxDistanceKm,
      offset,
    );

    // 2. Fallback 1: Nationwide RAG Search (Bypass city/district if local yields empty)
    if (candidates.length === 0 && (dbCity || dbDistrict)) {
      this.logger.log(
        'Local search yielded 0 candidates. Falling back to nationwide hybrid search.',
      );
      candidates = await this.vectorRepository.hybridSearch(
        userVector,
        userLat,
        userLng,
        30,
        undefined,
        undefined,
        categoryFilter,
        maxDistanceKm,
        offset,
      );
    }

    // 3. Fallback 2: General Relational Fallback (Query popular/featured foods directly from DB)
    if (candidates.length === 0) {
      this.logger.log(
        'RAG search returned 0 candidates. Triggering SQL Fallback for popular, featured, and high-quality foods.',
      );

      const dbFoods = await this.prisma.food.findMany({
        where: {
          status: FoodStatus.APPROVED,
          isActive: true,
        },
        take: 15,
        include: {
          restaurant: true,
          category: true,
        },
        orderBy: [
          { isAdminRecommended: 'desc' },
          { isFeaturedToday: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      candidates = dbFoods.map((f) => {
        let distance_km: number | null = null;
        if (
          userLat !== undefined &&
          userLng !== undefined &&
          f.lat !== null &&
          f.lng !== null
        ) {
          // Haversine distance estimation
          distance_km =
            111.02 *
            Math.sqrt(
              Math.pow(f.lat - userLat, 2) + Math.pow(f.lng - userLng, 2),
            );
        }

        return {
          id: f.id,
          name: f.name,
          price: f.price,
          description: f.description || '',
          image: f.image || '',
          tags: f.tags,
          restaurantName: f.restaurant?.name || '',
          address: f.address || f.restaurant?.address || '',
          lat: f.lat || 0,
          lng: f.lng || 0,
          categoryName: f.category?.name || '',
          embeddingSimilarity: 0.5, // Neutral similarity fallback
          distance_km,
          similarity: 0.5,
        };
      });
    }

    // 4. Sparse Keyword Matching (BM25 / ILIKE hybrid boost) to ensure exact keyword matches in DB are NEVER dropped
    const searchKeywords: string[] = [];
    const cuisine = state?.slots?.cuisineType?.toLowerCase().trim();
    if (cuisine && cuisine.length >= 2) {
      searchKeywords.push(cuisine);
    }
    if (message) {
      const msgLower = message.toLowerCase();
      const candidateTerms = [
        'chay',
        'thanh tịnh',
        'thanh đạm',
        'gym',
        'healthy',
        'eat clean',
        'salad',
        'ức gà',
        'poke',
        'cá hồi',
        'nướng',
        'bbq',
        'sườn',
        'lẩu',
        'bún bò',
        'bánh xèo',
        'chả cá',
        'bún mắm',
        'bún chả',
        'phở',
        'cơm tấm',
        'cơm niêu',
        'bánh mì',
        'hủ tiếu',
        'thịt trâu',
        'thắng cố',
        'dân tộc',
        'đặc sản',
      ];
      for (const term of candidateTerms) {
        if (msgLower.includes(term) && !searchKeywords.includes(term)) {
          searchKeywords.push(term);
        }
      }
    }

    if (searchKeywords.length > 0) {
      try {
        const keywordFoods = await this.prisma.food.findMany({
          where: {
            status: FoodStatus.APPROVED,
            isActive: true,
            OR: searchKeywords.flatMap((kw) => [
              { name: { contains: kw, mode: 'insensitive' } },
              { tags: { has: kw } },
              { category: { name: { contains: kw, mode: 'insensitive' } } },
              { restaurant: { name: { contains: kw, mode: 'insensitive' } } },
            ]),
          },
          take: 20,
          include: {
            restaurant: true,
            category: true,
          },
        });

        if (keywordFoods.length > 0) {
          const existingIds = new Set(candidates.map((c) => Number(c.id)));
          for (const kf of keywordFoods) {
            if (!existingIds.has(kf.id)) {
              let distance_km: number | null = null;
              if (
                userLat !== undefined &&
                userLng !== undefined &&
                kf.lat !== null &&
                kf.lng !== null
              ) {
                distance_km =
                  111.02 *
                  Math.sqrt(
                    Math.pow(kf.lat - userLat, 2) +
                      Math.pow(kf.lng - userLng, 2),
                  );
              }

              candidates.push({
                id: kf.id,
                name: kf.name,
                price: kf.price,
                description: kf.description || '',
                image: kf.image || '',
                tags: kf.tags,
                restaurantName: kf.restaurant?.name || '',
                address: kf.address || kf.restaurant?.address || '',
                lat: kf.lat || 0,
                lng: kf.lng || 0,
                categoryName: kf.category?.name || '',
                embeddingSimilarity: 0.85, // High similarity for direct keyword matches
                distance_km,
                similarity: 0.85,
              });
              existingIds.add(kf.id);
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          `Sparse keyword matching encountered an error: ${err}`,
        );
      }
    }

    return candidates;
  }
}
