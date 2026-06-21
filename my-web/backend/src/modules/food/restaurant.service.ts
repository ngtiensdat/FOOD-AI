// Mục đích: Service xử lý toàn bộ logic nghiệp vụ liên quan đến Restaurant (lấy nhà hàng gần đây, thức ăn của nhà hàng, follow/unfollow, analytics).
// Ý nghĩa: Tách biệt khỏi FoodService sau khi tái cấu trúc SOLID SRP, được inject vào RestaurantController và RestaurantPublicController.
// Các biến đặc biệt: ensureRestaurantOwnership (private guard), checkFollowListVisibility (private visibility check).
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantRepository } from './restaurant.repository';
import { FoodRepository } from './food.repository';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { User, FoodStatus, Prisma } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { RestaurantNearbyQueryDto } from './dto/restaurant-nearby-query.dto';

@Injectable()
export class RestaurantService {
  constructor(
    private repository: RestaurantRepository,
    private foodRepository: FoodRepository,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getNearbyRestaurants(query: RestaurantNearbyQueryDto) {
    const { lat, lng, radius } = query;
    if (lat === undefined || lng === undefined) return [];
    return this.repository.findNearbyRestaurants(
      lat,
      lng,
      radius || LIMITS.DEFAULT_NEARBY_RADIUS,
    );
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
            ratingAvg: restaurant.ratingAvg,
            ratingCount: restaurant.ratingCount,
            cuisines: restaurant.cuisines,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            profile: restaurant.profile,
            owner: restaurant.owner,
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

    const { data, total } =
      await this.foodRepository.findManyFoodsWithPagination(
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
