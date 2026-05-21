import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FoodRepository } from './food.repository';
import { AiService } from '../ai/ai.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';
import { UserRole, FoodStatus, Prisma, User } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { BulkCreateFoodDto } from './dto/bulk-create-food.dto';

@Injectable()
export class FoodService {
  constructor(
    private repository: FoodRepository,
    private aiService: AiService,
  ) {}

  async getAllFoods(query: FoodQueryDto) {
    const { tag, city, district } = query;
    const where: Prisma.FoodWhereInput = {
      isActive: true,
      status: FoodStatus.APPROVED,
      OR: [{ restaurantId: null }, { restaurant: { is: { isActive: true } } }],
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

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const result = await this.repository.findAll(where);
    let foods = result.data;

    if (tag) {
      const searchTags = tag
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t);

      foods = foods.filter((food) => {
        const foodTagsLower = food.tags.map((t) => t.toLowerCase());
        return searchTags.every((st) => foodTagsLower.includes(st));
      });
    }

    return {
      data: foods.slice(0, 20),
      meta: {
        total: tag ? foods.length : result.total,
        limit: 20,
      },
    };
  }

  async trackView(user: User, id: number) {
    if (!user) return;
    return this.repository.trackView(user.id, id);
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
    // 1. Kiểm tra xem cơ sở (Restaurant) được chọn có thuộc quyền sở hữu của Merchant không
    const restaurant = await this.repository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(
        'Bạn không có quyền đăng món ăn vào cơ sở này.',
      );
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

    // Check if any fields actually changed
    let hasChanges = false;
    if (dto.name !== undefined && dto.name !== food.name) hasChanges = true;
    if (dto.price !== undefined && dto.price !== food.price) hasChanges = true;
    if (
      dto.description !== undefined &&
      dto.description !== (food.description ?? '')
    )
      hasChanges = true;
    if (dto.image !== undefined && dto.image !== (food.image ?? ''))
      hasChanges = true;
    if (dto.address !== undefined && dto.address !== (food.address ?? ''))
      hasChanges = true;
    if (dto.mapUrl !== undefined && dto.mapUrl !== (food.mapUrl ?? ''))
      hasChanges = true;

    if (dto.lat !== undefined && dto.lat !== null) {
      if (food.lat === null || Number(dto.lat) !== Number(food.lat))
        hasChanges = true;
    } else if (dto.lat === null && food.lat !== null) {
      hasChanges = true;
    }

    if (dto.lng !== undefined && dto.lng !== null) {
      if (food.lng === null || Number(dto.lng) !== Number(food.lng))
        hasChanges = true;
    } else if (dto.lng === null && food.lng !== null) {
      hasChanges = true;
    }

    if (dto.tags !== undefined) {
      const currentTags = food.tags || [];
      const newTags = dto.tags || [];
      if (
        currentTags.length !== newTags.length ||
        !currentTags.every((t, i) => t === newTags[i])
      ) {
        hasChanges = true;
      }
    }

    const data: Prisma.FoodUpdateInput = { ...dto };
    if (user.role === UserRole.RESTAURANT && hasChanges) {
      data.status = FoodStatus.PENDING;
    }

    const updatedFood = await this.repository.update(id, data);
    void this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  async toggleRecommend(id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    return this.repository.update(id, {
      isAdminRecommended: !food.isAdminRecommended,
    });
  }

  async getFeaturedToday() {
    const result = await this.repository.findAll({
      isFeaturedToday: true,
      isActive: true,
      status: FoodStatus.APPROVED,
      OR: [{ restaurantId: null }, { restaurant: { is: { isActive: true } } }],
    });
    return result.data;
  }

  async getFeaturedWeekly() {
    const result = await this.repository.findAll({
      isFeaturedWeekly: true,
      isActive: true,
      status: FoodStatus.APPROVED,
      OR: [{ restaurantId: null }, { restaurant: { is: { isActive: true } } }],
    });
    return result.data;
  }

  async getRecommended() {
    const result = await this.repository.findAll({
      isAdminRecommended: true,
      isActive: true,
      status: FoodStatus.APPROVED,
      OR: [{ restaurantId: null }, { restaurant: { is: { isActive: true } } }],
    });
    return result.data;
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

  async getMerchantFoods(user: User) {
    const where: Prisma.FoodWhereInput = { deletedAt: null };
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
      if (!restaurant) return [];
      where.restaurantId = restaurant.id;
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

    return this.repository.delete(id);
  }

  async approveFood(id: number, status: FoodStatus) {
    return this.repository.update(id, { status });
  }
  async getMyRestaurant(user: User) {
    const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return restaurant;
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
    const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return this.repository.updateRestaurantStatus(restaurant.id, isActive);
  }

  async updateMyRestaurantProfile(
    user: User,
    openingHours?: string,
    contactPhone?: string,
  ) {
    const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return this.repository.updateRestaurantProfile(restaurant.id, {
      openingHours,
      contactPhone,
    });
  }

  async getPublicRestaurant(id: number, requestingUser?: User) {
    const restaurant = await this.repository.findPublicRestaurantById(id);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    let isFollowing = false;
    if (requestingUser) {
      isFollowing = await this.repository.isUserFollowingRestaurant(
        requestingUser.id,
        id,
      );
    }

    const followingCount = await this.repository.countMerchantFollowing(
      restaurant.ownerId,
    );

    const prefs = (await this.repository.getUserPreferences(
      restaurant.ownerId,
    )) as { showFollowList?: boolean };
    const showFollowList = prefs.showFollowList !== false; // mặc định là true

    // Only return first 5 foods by default if categoryId is not applied,
    // or we just return stats and let frontend fetch foods paginated.
    // For backward compatibility, we'll keep foods here but maybe limited.

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
        profile: restaurant.profile,
        foods: restaurant.foods.slice(0, LIMITS.RESTAURANT_INITIAL_FOODS),
      },
      stats: {
        followersCount: restaurant._count.followers,
        followingCount,
        showFollowList,
      },
      isFollowing,
    };
  }

  async getPublicRestaurantFoods(
    restaurantId: number,
    categoryId?: number,
    page: number = 1,
    pageSize: number = 5,
  ) {
    const where: Prisma.FoodWhereInput = {
      restaurantId,
      isActive: true,
      status: FoodStatus.APPROVED,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [data, total] = await Promise.all([
      this.repository['prisma'].food.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.repository['prisma'].food.count({ where }),
    ]);

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
}
