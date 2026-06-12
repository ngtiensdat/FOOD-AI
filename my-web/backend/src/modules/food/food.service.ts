// Mục đích: Cung cấp dịch vụ quản lý thực đơn món ăn (Food) và các hành vi tương tác liên quan đến nhà hàng (Theo dõi, hồ sơ nhà hàng).
// File quan hệ: Gọi FoodRepository, AiService và được gọi bởi FoodController, RestaurantController, RestaurantPublicController.
// Chức năng đặc biệt: Xử lý tìm kiếm món ăn lân cận, bộ lọc theo thẻ (tags) và địa phương (thành phố, quận), CRUD món ăn (gán quyền sở hữu tương ứng, chống IDOR), tạo hàng loạt (bulk create) món ăn có trigger cập nhật vector embedding tương ứng trong background.
// Kiến thức/Design Pattern: Service Layer Pattern, SOLID (Single Responsibility - Điều phối logic thực đơn, Dependency Inversion), Ownership Check (IDOR protection), Background Processing Pattern.
// Các biến, hàm đặc biệt: getAllFoods(), trackView(), getRecentFoods(), getNearbyFoods(), getFeaturedToday(), getFeaturedWeekly(), getRecommended(), getMerchantFoods(), search(), createFood(), createBulk(), updateFood(), deleteFood(), toggleRecommend(), approveFood(), getRestaurant(), updateRestaurantProfile(), getRestaurantFollowers(), followRestaurant(), unfollowRestaurant(), checkFollowStatus(), getFollowingCount().

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FoodRepository } from './food.repository';
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
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { RestaurantNearbyQueryDto } from './dto/restaurant-nearby-query.dto';

const FOOD_DISPLAY_LIMIT = 20;

@Injectable()
export class FoodService {
  constructor(
    private repository: FoodRepository,
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

    // Sync with AI Feedback Learning: find or create the user's latest conversation
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
      // Favorite -> Add LIKE feedback
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
      // Unfavorite -> Remove LIKE feedback if it exists
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

    // Trigger background embedding update to keep preferences synced
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

  async getNearbyRestaurants(query: RestaurantNearbyQueryDto) {
    const { lat, lng, radius } = query;
    if (lat === undefined || lng === undefined) return [];
    return this.repository.findNearbyRestaurants(
      lat,
      lng,
      radius || LIMITS.DEFAULT_NEARBY_RADIUS,
    );
  }

  async createFood(user: User, dto: CreateFoodDto) {
    // 1. Kiểm tra xem cơ sở (Restaurant) được chọn có thuộc quyền sở hữu của Merchant không
    const restaurant = await this.repository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_POST_PERMISSION);
    }

    // 2. Tự động sao chép thông tin địa chỉ từ chi nhánh (Onboarding) sang món ăn
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

    // 3. Tạo món ăn trong DB liên kết với chi nhánh tương ứng
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
    const restaurant = await this.repository.findRestaurantById(
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

    // Kiểm tra quyền sở hữu (Rule 5 - Security & Ownership)
    if (user.role === UserRole.RESTAURANT) {
      if (food.restaurant?.ownerId !== user.id) {
        throw new ForbiddenException(MESSAGES.FOOD.NO_EDIT_PERMISSION);
      }
    }

    // Check if any fields actually changed (Generic Check - avoids manual comparison errors)
    const keysToCheck = Object.keys(dto) as Array<keyof UpdateFoodDto>;
    const hasChanges = keysToCheck.some((key) => {
      const dtoValue = dto[key];
      const dbValue = food[key];

      if (dtoValue === undefined) return false;

      // Handle array comparison (e.g. tags)
      if (Array.isArray(dtoValue) && Array.isArray(dbValue)) {
        return (
          dtoValue.length !== dbValue.length ||
          !dtoValue.every((val, idx) => val === dbValue[idx])
        );
      }

      // Normalize empty comparison (null / undefined / empty string)
      const normalizedDto =
        dtoValue === null || dtoValue === undefined ? '' : dtoValue;
      const normalizedDb =
        dbValue === null || dbValue === undefined ? '' : dbValue;

      // Handle numbers comparison (e.g. price, lat, lng)
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
      const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
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

    // Rule 5 - Security & Ownership
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
  async getMyRestaurant(user: User) {
    return this.ensureRestaurantOwnership(user.id);
  }

  async getMyBranches(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    if (!branches || branches.length === 0) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return branches;
  }

  async updateMyRestaurantStatus(user: User, isActive: boolean) {
    const restaurant = await this.ensureRestaurantOwnership(user.id);
    const result = await this.repository.updateRestaurantStatus(
      restaurant.id,
      isActive,
    );
    await this.cacheService.invalidatePattern(
      `restaurants:public:${restaurant.id}`,
    );
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async updateMyRestaurantProfile(user: User, dto: UpdateRestaurantProfileDto) {
    const restaurant = await this.ensureRestaurantOwnership(user.id);
    const result = await this.repository.updateRestaurantProfileTransaction(
      restaurant.id,
      user.id,
      dto,
    );
    await this.cacheService.invalidatePattern(
      `restaurants:public:${restaurant.id}`,
    );
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async getPublicRestaurant(id: number, requestingUser?: User) {
    const cachedData = await this.cacheService.wrap(
      `restaurants:public:${id}`,
      async () => {
        const restaurant = await this.repository.findPublicRestaurantById(id);
        if (!restaurant) {
          return null;
        }

        const followingCount = await this.repository.countMerchantFollowing(
          restaurant.ownerId,
        );

        const prefs = (await this.repository.getUserPreferences(
          restaurant.ownerId,
        )) as { showFollowList?: boolean };
        const showFollowList = prefs.showFollowList !== false; // mặc định là true

        return {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            description: restaurant.description,
            mapUrl: restaurant.mapUrl,
            isActive: restaurant.isActive,
            ownerId: restaurant.ownerId,
            createdAt: restaurant.createdAt,
            // Các trường từ dataset
            ratingAvg: restaurant.ratingAvg,
            ratingCount: restaurant.ratingCount,
            cuisines: restaurant.cuisines,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            profile: restaurant.profile,
            foods: restaurant.foods.slice(0, LIMITS.RESTAURANT_INITIAL_FOODS),
          },
          stats: {
            followersCount: restaurant._count.followers,
            followingCount,
            showFollowList,
          },
        };
      },
      600, // 10 minutes TTL
    );

    if (!cachedData) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    let isFollowing = false;
    if (requestingUser) {
      isFollowing = await this.repository.isUserFollowingRestaurant(
        requestingUser.id,
        id,
      );
    }

    return {
      ...cachedData,
      isFollowing,
    };
  }

  async getPublicRestaurantFoods(
    restaurantId: number,
    categoryId?: number,
    page: number = 1,
    pageSize: number = 8,
  ) {
    const where: Prisma.FoodWhereInput = {
      restaurantId,
      isActive: true,
      status: FoodStatus.APPROVED,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { data, total } = await this.repository.findManyFoodsWithPagination(
      where,
      (page - 1) * pageSize,
      pageSize,
    );

    return {
      items: data,
      total,
      page,
      pageSize,
    };
  }

  private async checkFollowListVisibility(
    restaurantId: number,
    requestingUser?: User,
  ) {
    const restaurant = await this.repository.findRestaurantById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    const prefs = (await this.repository.getUserPreferences(
      restaurant.ownerId,
    )) as { showFollowList?: boolean };
    const showFollowList = prefs.showFollowList !== false; // mặc định là true

    if (!showFollowList && requestingUser?.id !== restaurant.ownerId) {
      throw new ForbiddenException(MESSAGES.RESTAURANT.PRIVATE_FOLLOW_LIST);
    }

    return restaurant;
  }

  async getRestaurantFollowers(id: number, requestingUser?: User) {
    await this.checkFollowListVisibility(id, requestingUser);
    return this.repository.findRestaurantFollowers(id);
  }

  async getMerchantFollowing(id: number, requestingUser?: User) {
    const restaurant = await this.checkFollowListVisibility(id, requestingUser);
    return this.repository.findMerchantFollowing(restaurant.ownerId);
  }

  async toggleFollowRestaurant(userId: number, restaurantId: number) {
    const restaurant = await this.repository.findRestaurantById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    const isFollowing = await this.repository.isUserFollowingRestaurant(
      userId,
      restaurantId,
    );
    if (isFollowing) {
      await this.repository.unfollowRestaurant(userId, restaurantId);
      return { followed: false };
    } else {
      await this.repository.followRestaurant(userId, restaurantId);
      return { followed: true };
    }
  }

  async getPublicRestaurants(filters: {
    search?: string;
    city?: string;
    district?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.repository.findManyPublicRestaurants(filters);
  }

  async getMyAnalytics(user: User) {
    const restaurant = await this.ensureRestaurantOwnership(user.id);

    const foods = await this.prisma.food.findMany({
      where: { restaurantId: restaurant.id, deletedAt: null },
      select: { id: true, name: true },
    });

    if (foods.length === 0) return [];

    const foodIds = foods.map((f) => f.id);

    // Aggregate views and AI suggestions in 2 queries instead of N*2
    const [viewCounts, aiCounts] = await Promise.all([
      this.prisma.history.groupBy({
        by: ['foodId'],
        where: { foodId: { in: foodIds } },
        _count: { foodId: true },
      }),
      this.prisma.aiFeedback.groupBy({
        by: ['foodId'],
        where: { foodId: { in: foodIds } },
        _count: { foodId: true },
      }),
    ]);

    const viewMap = new Map(viewCounts.map((v) => [v.foodId, v._count.foodId]));
    const aiMap = new Map(aiCounts.map((a) => [a.foodId, a._count.foodId]));

    return foods.map((food) => ({
      id: food.id,
      name: food.name,
      views: viewMap.get(food.id) ?? 0,
      aiSuggestions: aiMap.get(food.id) ?? 0,
    }));
  }

  private async ensureRestaurantOwnership(userId: number) {
    const restaurant = await this.repository.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return restaurant;
  }
}
