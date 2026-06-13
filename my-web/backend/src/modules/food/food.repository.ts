// Mục đích: Cung cấp các phương thức tương tác trực tiếp với cơ sở dữ liệu để thực hiện các nghiệp vụ của thực đơn món ăn (Food) qua Prisma.
// File quan hệ: Gọi PrismaService, sử dụng các kiểu dữ liệu của @prisma/client và được gọi bởi FoodService, AdminService.
// Chức năng đặc biệt: Thực hiện phân trang danh sách món ăn, ghi nhận lịch sử xem món ăn, lấy danh sách xem gần nhất, tìm kiếm món ăn lân cận dựa trên khoảng cách địa lý (Point distance raw query) sử dụng tọa độ.
// Kiến thức/Design Pattern: Repository Pattern, Geographic Querying (point distance <->), Dependency Injection, Pagination.
// Các biến, hàm đặc biệt: NearbyResult (Interface); findAll(), trackView(), findRecentViews(), findById(), findNearby(), findFeaturedToday(), findFeaturedWeekly(), findRecommended(), findMerchantFoods(), search(), create(), createBulk(), update(), delete(), toggleRecommend(), updateStatus().

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FoodStatus, Food } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';

export interface NearbyResult {
  id: number;
  distance: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_LATITUDE_DEGREE = 111.045;

@Injectable()
export class FoodRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    where: Prisma.FoodWhereInput,
    page?: number,
    pageSize?: number,
  ) {
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;
    const take = pageSize
      ? pageSize
      : page
        ? LIMITS.FOOD_LIST_PAGINATION
        : undefined;

    const [data, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              mapUrl: true,
              ownerId: true,
              isActive: true,
              profile: {
                select: { openingHours: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.food.count({ where }),
    ]);
    return { data, total };
  }

  async trackView(userId: number, foodId: number) {
    // Lấy restaurantId từ food
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      select: { restaurantId: true },
    });

    // Deduplicate: nếu đã xem cùng món trong 30 phút gần đây, chỉ update visitedAt
    const recentThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const recentView = await this.prisma.history.findFirst({
      where: {
        userId,
        foodId,
        visitedAt: { gte: recentThreshold },
      },
    });

    if (recentView) {
      return this.prisma.history.update({
        where: { id: recentView.id },
        data: { visitedAt: new Date() },
      });
    }

    return this.prisma.history.create({
      data: {
        userId,
        foodId,
        restaurantId: food?.restaurantId,
      },
    });
  }

  async toggleFavorite(userId: number, foodId: number): Promise<boolean> {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_foodId: {
          userId,
          foodId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          userId_foodId: {
            userId,
            foodId,
          },
        },
      });
      return false;
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          foodId,
        },
      });
      return true;
    }
  }

  async findRecentViews(
    userId: number,
    limit: number = LIMITS.DEFAULT_RECENT_VIEWS,
  ) {
    return this.prisma.history.findMany({
      where: {
        userId,
        foodId: { not: null },
        food: {
          deletedAt: null,
          isActive: true,
        },
      },
      include: {
        food: {
          include: {
            restaurant: { select: { name: true } },
          },
        },
      },
      orderBy: { visitedAt: 'desc' },
      take: limit,
      distinct: ['foodId'], // Chỉ lấy món ăn duy nhất
    });
  }

  async findById(id: number) {
    return this.prisma.food.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            mapUrl: true,
            ownerId: true,
            isActive: true,
            profile: {
              select: { openingHours: true },
            },
          },
        },
      },
    });
  }

  async findNearby(lat: number, lng: number, radius: number) {
    // 1. Tính toán Bounding Box để lọc thô (Tránh Full Table Scan tính Haversine)
    // 1 độ vĩ độ (latitude) ~ 111.045 km
    const latDelta = radius / KM_PER_LATITUDE_DEGREE;
    // 1 độ kinh độ (longitude) ~ 111.045 * cos(lat) km
    const lngDelta =
      radius / (KM_PER_LATITUDE_DEGREE * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // 2. Lọc thô bằng Bounding Box trước, sau đó mới tính khoảng cách chính xác bằng Haversine
    // Sử dụng LEAST/GREATEST để giới hạn đầu vào của acos trong khoảng [-1, 1], tránh lỗi chính xác số thực làm đổ vỡ truy vấn
    const nearbyResults = await this.prisma.$queryRaw<NearbyResult[]>`
      SELECT f.id, 
        (${EARTH_RADIUS_KM} * acos(LEAST(GREATEST(cos(radians(${lat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f.lat)), -1.0), 1.0))) AS distance
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = ${FoodStatus.APPROVED} 
        AND f.lat IS NOT NULL 
        AND f.lng IS NOT NULL
        AND f.lat BETWEEN ${minLat} AND ${maxLat}
        AND f.lng BETWEEN ${minLng} AND ${maxLng}
        AND (${EARTH_RADIUS_KM} * acos(LEAST(GREATEST(cos(radians(${lat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f.lat)), -1.0), 1.0))) <= ${radius}
      ORDER BY distance ASC
      LIMIT ${LIMITS.DEFAULT_NEARBY_PAGINATION}
    `;

    if (nearbyResults.length === 0) return [];

    const foods = await this.prisma.food.findMany({
      where: { id: { in: nearbyResults.map((r) => r.id) } },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            mapUrl: true,
            ownerId: true,
            isActive: true,
            profile: {
              select: { openingHours: true },
            },
          },
        },
      },
    });

    return foods
      .map((f) => {
        const row = nearbyResults.find((r) => r.id === f.id);
        const distanceValue = row ? row.distance : 0;
        return {
          ...f,
          distance: distanceValue,
        };
      })
      .sort(
        (a: { distance: number }, b: { distance: number }) =>
          a.distance - b.distance,
      );
  }

  async findNearbyRestaurants(lat: number, lng: number, radius: number) {
    // 1. Tính toán Bounding Box để lọc thô
    const latDelta = radius / KM_PER_LATITUDE_DEGREE;
    const lngDelta =
      radius / (KM_PER_LATITUDE_DEGREE * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // 2. Lọc thô bằng Bounding Box trước, sau đó tính khoảng cách bằng Haversine
    // Sử dụng LEAST/GREATEST để giới hạn đầu vào của acos trong khoảng [-1, 1], tránh lỗi chính xác số thực làm đổ vỡ truy vấn
    const nearbyResults = await this.prisma.$queryRaw<NearbyResult[]>`
      SELECT r.id, 
        (${EARTH_RADIUS_KM} * acos(LEAST(GREATEST(cos(radians(${lat})) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(r.latitude)), -1.0), 1.0))) AS distance
      FROM restaurants r
      WHERE r.is_active = true 
        AND r.deleted_at IS NULL
        AND r.latitude BETWEEN ${minLat} AND ${maxLat}
        AND r.longitude BETWEEN ${minLng} AND ${maxLng}
        AND (${EARTH_RADIUS_KM} * acos(LEAST(GREATEST(cos(radians(${lat})) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(r.latitude)), -1.0), 1.0))) <= ${radius}
      ORDER BY distance ASC
      LIMIT ${LIMITS.DEFAULT_NEARBY_PAGINATION}
    `;

    if (nearbyResults.length === 0) return [];

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: nearbyResults.map((r) => r.id) } },
      include: {
        profile: true,
        foods: {
          where: {
            isActive: true,
            status: FoodStatus.APPROVED,
          },
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            tags: true,
          },
          take: 5,
        },
        _count: {
          select: { followers: true },
        },
      },
    });

    return restaurants
      .map((r) => {
        const row = nearbyResults.find((res) => res.id === r.id);
        const distanceValue = row ? row.distance : 0;
        return {
          ...r,
          distance: distanceValue,
        };
      })
      .sort(
        (a: { distance: number }, b: { distance: number }) =>
          a.distance - b.distance,
      );
  }

  async create(data: Prisma.FoodUncheckedCreateInput) {
    return this.prisma.food.create({ data });
  }

  async createMany(data: Prisma.FoodCreateManyInput[]) {
    return this.prisma.food.createMany({
      data,
    });
  }

  async update(id: number, data: Prisma.FoodUpdateInput) {
    return this.prisma.food.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.food.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async findAllFoodsWithRestaurant(page?: number, pageSize?: number) {
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;
    const take = pageSize
      ? pageSize
      : page
        ? LIMITS.ADMIN_FOODS_PAGE_SIZE
        : undefined;

    const [data, total] = await Promise.all([
      this.prisma.food.findMany({
        where: { deletedAt: null },
        include: {
          restaurant: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.food.count({
        where: { deletedAt: null },
      }),
    ]);
    return { data, total };
  }

  async findRestaurantByOwnerId(ownerId: number) {
    return this.prisma.restaurant.findFirst({
      where: { ownerId },
      include: {
        profile: true,
      },
    });
  }

  async findManyRestaurantsByOwnerId(ownerId: number) {
    return this.prisma.restaurant.findMany({
      where: { ownerId },
      include: {
        profile: true,
      },
    });
  }

  async findRestaurantById(id: number) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async findPublicRestaurantById(id: number) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        profile: true,
        foods: {
          where: {
            isActive: true,
            status: FoodStatus.APPROVED,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });
  }

  async getUserPreferences(userId: number): Promise<Record<string, unknown>> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });
    return (profile?.preferences as Record<string, unknown>) || {};
  }

  async findRestaurantFollowers(restaurantId: number) {
    return this.prisma.follow.findMany({
      where: { restaurantId },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findMerchantFollowing(ownerId: number) {
    return this.prisma.follow.findMany({
      where: { userId: ownerId },
      select: {
        id: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            mapUrl: true,
            profile: {
              select: {
                coverImage: true,
              },
            },
          },
        },
      },
    });
  }

  async isUserFollowingRestaurant(
    userId: number,
    restaurantId: number,
  ): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        userId_restaurantId: { userId, restaurantId },
      },
    });
    return !!follow;
  }

  async followRestaurant(userId: number, restaurantId: number) {
    return this.prisma.follow.create({
      data: { userId, restaurantId },
    });
  }

  async unfollowRestaurant(userId: number, restaurantId: number) {
    return this.prisma.follow.delete({
      where: {
        userId_restaurantId: { userId, restaurantId },
      },
    });
  }

  async countMerchantFollowing(ownerId: number): Promise<number> {
    return this.prisma.follow.count({
      where: { userId: ownerId },
    });
  }

  async updateRestaurantStatus(id: number, isActive: boolean) {
    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive },
    });
  }

  async updateRestaurantProfileTransaction(
    restaurantId: number,
    ownerId: number,
    dto: UpdateRestaurantProfileDto,
  ) {
    const {
      name,
      address,
      city,
      district,
      description,
      mapUrl,
      logo,
      coverImage,
      bio,
      contactEmail,
      contactPhone,
      openingHours,
      syncWithPersonalAvatar,
      syncWithPersonalCover,
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật bảng Restaurant
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          name,
          address,
          city,
          district,
          description,
          mapUrl,
        },
      });

      // 2. Cập nhật bảng RestaurantProfile
      const profileData = {
        logo,
        coverImage,
        bio,
        contactEmail,
        contactPhone,
        openingHours,
      };

      await tx.restaurantProfile.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          ...profileData,
        },
        update: profileData,
      });

      // 3. Đồng bộ hai chiều sang UserProfile nếu có cờ sync
      if (syncWithPersonalAvatar && logo) {
        await tx.userProfile.update({
          where: { userId: ownerId },
          data: { avatar: logo },
        });
      }

      if (syncWithPersonalCover && coverImage) {
        await tx.userProfile.update({
          where: { userId: ownerId },
          data: { coverImage },
        });
      }

      // Trả về dữ liệu cập nhật hoàn chỉnh
      return tx.restaurant.findUnique({
        where: { id: restaurantId },
        include: { profile: true },
      });
    });
  }

  async findManyPublicRestaurants(filters: {
    search?: string;
    city?: string;
    district?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, city, district, tag, page = 1, pageSize = 10 } = filters;

    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
    };

    const andFilters: Prisma.RestaurantWhereInput[] = [];

    if (search) {
      andFilters.push({
        name: { contains: search, mode: 'insensitive' },
      });
    }

    if (city) {
      andFilters.push({
        city: { equals: city, mode: 'insensitive' },
      });
    }

    if (district) {
      andFilters.push({
        district: { equals: district, mode: 'insensitive' },
      });
    }

    if (tag) {
      andFilters.push({
        foods: {
          some: {
            isActive: true,
            status: FoodStatus.APPROVED,
            tags: {
              has: tag,
            },
          },
        },
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        include: {
          profile: true,
          foods: {
            where: {
              isActive: true,
              status: FoodStatus.APPROVED,
            },
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              tags: true,
            },
            take: 5,
          },
          _count: {
            select: { followers: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { restaurants: data, total };
  }

  async findManyFoodsWithPagination(
    where: Prisma.FoodWhereInput,
    skip: number,
    take: number,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.food.count({ where }),
    ]);
    return { data, total };
  }

  async updateWeeklyFeatured(id: number, value: boolean) {
    return this.prisma.food.update({
      where: { id },
      data: { isFeaturedWeekly: value },
    });
  }

  async batchUpdate(
    updates: {
      id: number;
      isFeaturedToday?: boolean;
      isFeaturedWeekly?: boolean;
      isAdminRecommended?: boolean;
    }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updatedFoods: Food[] = [];
      for (const update of updates) {
        const { id, ...data } = update;
        const updated = await tx.food.update({
          where: { id },
          data,
        });
        updatedFoods.push(updated);
      }
      return updatedFoods;
    });
  }
}
