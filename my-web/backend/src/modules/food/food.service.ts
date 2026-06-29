import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FoodRepository } from './food.repository';
import { RestaurantRepository } from './restaurant.repository';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AiLearningService } from '../ai/services/ai-learning.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';
import { UserRole, FoodStatus, Prisma, User } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { BulkCreateFoodDto } from './dto/bulk-create-food.dto';

const FOOD_DISPLAY_LIMIT = 20;

@Injectable()
export class FoodService {
  constructor(
    private repository: FoodRepository,
    private restaurantRepository: RestaurantRepository,
    private aiService: AiService,
    private prisma: PrismaService,
    private aiLearningService: AiLearningService,
    private cacheService: CacheService,
  ) {}

  async getAllFoods(query: FoodQueryDto) {
    const cacheKey = `foods:list:${JSON.stringify(query)}`;
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const { tag, city, district } = query;
        const where: Prisma.FoodWhereInput = {
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        };

        const andFilters: Prisma.FoodWhereInput[] = [];

        if (city) {
          andFilters.push({
            OR: [
              { address: { contains: city, mode: 'insensitive' } },
              {
                restaurant: {
                  is: { address: { contains: city, mode: 'insensitive' } },
                },
              },
            ],
          });
        }

        if (district) {
          andFilters.push({
            OR: [
              { address: { contains: district, mode: 'insensitive' } },
              {
                restaurant: {
                  is: { address: { contains: district, mode: 'insensitive' } },
                },
              },
            ],
          });
        }

        if (tag) {
          const searchTags = tag
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t);
          if (searchTags.length > 0) {
            andFilters.push({
              tags: {
                hasEvery: searchTags,
              },
            });
          }
        }

        if (andFilters.length > 0) {
          where.AND = andFilters;
        }

        const result = await this.repository.findAll(where);
        const foods = result.data;

        return {
          data: foods.slice(0, FOOD_DISPLAY_LIMIT),
          meta: {
            total: result.total,
            limit: FOOD_DISPLAY_LIMIT,
          },
        };
      },
      300, // 5 minutes TTL
    );
  }

  async trackView(user: User, id: number) {
    if (!user) return;
    return this.repository.trackView(user.id, id);
  }

  async toggleFavorite(userId: number, foodId: number) {
    const isFavorite = await this.repository.toggleFavorite(userId, foodId);

    let conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          metadata: {
            title: 'Hội thoại mới',
            slots: {},
            current_stage: 'COLLECTING',
            rejected_food_ids: [],
            suggested_food_ids: [],
          },
        },
      });
    }

    if (isFavorite) {
      await this.prisma.aiFeedback.upsert({
        where: {
          userId_foodId: {
            userId,
            foodId,
          },
        },
        create: {
          userId,
          conversationId: conversation.id,
          foodId,
          feedbackType: 'LIKE',
        },
        update: {
          feedbackType: 'LIKE',
          createdAt: new Date(),
        },
      });
    } else {
      const existingFeedback = await this.prisma.aiFeedback.findUnique({
        where: {
          userId_foodId: {
            userId,
            foodId,
          },
        },
      });
      if (existingFeedback && existingFeedback.feedbackType === 'LIKE') {
        await this.prisma.aiFeedback.delete({
          where: {
            userId_foodId: {
              userId,
              foodId,
            },
          },
        });
      }
    }

    this.aiLearningService
      .updateUserEmbeddingWithFeedback(userId)
      .catch((err: unknown) => {
        // Gracefully handle embedding calculation failure in background
      });

    return { isFavorite };
  }

  async getRecentFoods(
    user: User,
    limit: number = LIMITS.DEFAULT_RECENT_VIEWS,
  ) {
    if (!user) return [];
    return this.repository.findRecentViews(user.id, limit);
  }

  async getNearbyFoods(query: FoodQueryDto) {
    const { lat, lng, radius, city, district } = query;
    if (lat === undefined || lng === undefined) return [];
    let foods = await this.repository.findNearby(
      lat,
      lng,
      radius || LIMITS.DEFAULT_NEARBY_RADIUS,
    );

    if (city) {
      const cityLower = city.toLowerCase();
      foods = foods.filter(
        (f) =>
          (f.address && f.address.toLowerCase().includes(cityLower)) ||
          (f.restaurant?.address &&
            f.restaurant.address.toLowerCase().includes(cityLower)),
      );
    }

    if (district) {
      const districtLower = district.toLowerCase();
      foods = foods.filter(
        (f) =>
          (f.address && f.address.toLowerCase().includes(districtLower)) ||
          (f.restaurant?.address &&
            f.restaurant.address.toLowerCase().includes(districtLower)),
      );
    }

    return foods;
  }

  async createFood(user: User, dto: CreateFoodDto) {
    const restaurant = await this.restaurantRepository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_POST_PERMISSION);
    }

    let lat = dto.lat;
    let lng = dto.lng;
    let address = dto.address;
    let mapUrl = dto.mapUrl;

    if (!lat || !lng || !address || !mapUrl) {
      lat = lat || restaurant.latitude;
      lng = lng || restaurant.longitude;
      address = address || restaurant.address;
      mapUrl = mapUrl || restaurant.mapUrl || undefined;
    }

    const food = await this.repository.create({
      name: dto.name,
      price: dto.price,
      description: dto.description,
      image: dto.image,
      tags: dto.tags || [],
      lat,
      lng,
      address,
      mapUrl,
      calories: dto.calories ?? 0,
      carbs: dto.carbs ?? 0,
      protein: dto.protein ?? 0,
      fat: dto.fat ?? 0,
      categoryId: dto.categoryId || null,
      restaurantId: dto.restaurantId,
      status:
        user.role === UserRole.ADMIN ? FoodStatus.APPROVED : FoodStatus.PENDING,
      isActive: true,
    });

    void this.aiService.updateFoodEmbedding(food.id);
    await this.cacheService.invalidatePattern('foods:*');
    return food;
  }

  async createBulk(user: User, dto: BulkCreateFoodDto) {
    const restaurant = await this.restaurantRepository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_EDIT_PERMISSION);
    }

    const defaultLat = restaurant.latitude;
    const defaultLng = restaurant.longitude;
    const defaultAddress = restaurant.address;
    const defaultMapUrl = restaurant.mapUrl || null;
    const defaultStatus =
      user.role === UserRole.ADMIN ? FoodStatus.APPROVED : FoodStatus.PENDING;

    const dataToInsert = dto.foods.map((foodDto) => ({
      name: foodDto.name,
      price: foodDto.price,
      description: foodDto.description || null,
      image: foodDto.image || null,
      tags: foodDto.tags || [],
      lat: foodDto.lat ?? defaultLat,
      lng: foodDto.lng ?? defaultLng,
      address: foodDto.address ?? defaultAddress,
      mapUrl: foodDto.mapUrl ?? defaultMapUrl,
      calories: foodDto.calories ?? 0,
      carbs: foodDto.carbs ?? 0,
      protein: foodDto.protein ?? 0,
      fat: foodDto.fat ?? 0,
      restaurantId: dto.restaurantId,
      categoryId: foodDto.categoryId || null,
      status: defaultStatus,
      isActive: true,
    }));

    const result = await this.repository.createMany(dataToInsert);
    await this.cacheService.invalidatePattern('foods:*');
    return { count: result.count };
  }

  async updateFood(user: User, id: number, dto: UpdateFoodDto) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT) {
      if (food.restaurant?.ownerId !== user.id) {
        throw new ForbiddenException(MESSAGES.FOOD.NO_EDIT_PERMISSION);
      }
    }

    const keysToCheck = Object.keys(dto) as Array<keyof UpdateFoodDto>;
    const hasChanges = keysToCheck.some((key) => {
      const dtoValue = dto[key];
      const dbValue = food[key];

      if (dtoValue === undefined) return false;

      if (Array.isArray(dtoValue) && Array.isArray(dbValue)) {
        return (
          dtoValue.length !== dbValue.length ||
          !dtoValue.every((val, idx) => val === dbValue[idx])
        );
      }

      const normalizedDto =
        dtoValue === null || dtoValue === undefined ? '' : dtoValue;
      const normalizedDb =
        dbValue === null || dbValue === undefined ? '' : dbValue;

      if (
        typeof normalizedDto === 'number' ||
        typeof normalizedDb === 'number'
      ) {
        return Number(normalizedDto) !== Number(normalizedDb);
      }

      return normalizedDto !== normalizedDb;
    });

    const data: Prisma.FoodUpdateInput = { ...dto };
    if (user.role === UserRole.RESTAURANT && hasChanges) {
      data.status = FoodStatus.PENDING;
    }

    const updatedFood = await this.repository.update(id, data);
    void this.aiService.updateFoodEmbedding(updatedFood.id);
    await this.cacheService.invalidatePattern('foods:*');
    return updatedFood;
  }

  async toggleRecommend(id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    const updated = await this.repository.update(id, {
      isAdminRecommended: !food.isAdminRecommended,
    });
    await this.cacheService.invalidatePattern('foods:*');
    return updated;
  }

  async getFeaturedToday() {
    return this.cacheService.wrap(
      'foods:featured-today',
      async () => {
        const result = await this.repository.findAll({
          isFeaturedToday: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async getFeaturedWeekly() {
    return this.cacheService.wrap(
      'foods:featured-weekly',
      async () => {
        const result = await this.repository.findAll({
          isFeaturedWeekly: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async getRecommended() {
    return this.cacheService.wrap(
      'foods:recommended',
      async () => {
        const result = await this.repository.findAll({
          isAdminRecommended: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async search(query: string) {
    if (!query) return { data: [], meta: { total: 0 } };
    const result = await this.repository.findAll({
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            {
              restaurant: {
                is: { name: { contains: query, mode: 'insensitive' } },
              },
            },
            {
              restaurant: {
                is: { address: { contains: query, mode: 'insensitive' } },
              },
            },
          ],
        },
        {
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        },
      ],
      isActive: true,
      status: FoodStatus.APPROVED,
    });
    return result;
  }

  async getMerchantFoods(user: User, page?: number, pageSize?: number) {
    const where: Prisma.FoodWhereInput = { deletedAt: null };
    if (user.role === UserRole.RESTAURANT) {
      const restaurant =
        await this.restaurantRepository.findRestaurantByOwnerId(user.id);
      if (!restaurant) {
        return page && pageSize
          ? { data: [], meta: { total: 0, page, pageSize } }
          : [];
      }
      where.restaurantId = restaurant.id;
    }

    if (page && pageSize) {
      const result = await this.repository.findAll(where, page, pageSize);
      return {
        data: result.data,
        meta: {
          total: result.total,
          page,
          pageSize,
        },
      };
    }

    const result = await this.repository.findAll(where);
    return result.data;
  }

  async deleteFood(user: User, id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    if (
      user.role === UserRole.RESTAURANT &&
      food.restaurant?.ownerId !== user.id
    ) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_DELETE_PERMISSION);
    }

    const result = await this.repository.delete(id);
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async approveFood(id: number, status: FoodStatus) {
    const result = await this.repository.update(id, {
      status,
      isAdminRecommended: false,
      isFeaturedToday: false,
      isFeaturedWeekly: false,
    });
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }
}
