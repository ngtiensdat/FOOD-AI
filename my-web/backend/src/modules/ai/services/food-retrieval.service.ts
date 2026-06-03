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
  ): Promise<SearchResult[]> {
    const dbDistrict =
      district && district !== 'Vị trí GPS hiện tại' ? district : undefined;
    const dbCity = city ? city : undefined;

    // Check if user is asking for nearby alternatives to previously suggested foods
    if (
      intent === FoodIntent.FIND_NEARBY &&
      state &&
      state.suggested_food_ids &&
      state.suggested_food_ids.length > 0
    ) {
      const lastFoodId = state.suggested_food_ids[0];
      const lastFood = await this.prisma.food.findUnique({
        where: { id: lastFoodId },
        include: { category: true },
      });

      if (lastFood) {
        this.logger.log(
          `FIND_NEARBY intent detected. Finding closer alternatives for food type: ${lastFood.name} (Category ID: ${lastFood.categoryId})`,
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

    return candidates;
  }
}
