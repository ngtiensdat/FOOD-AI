import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FoodStatus } from '@prisma/client';

export interface NearbyResult {
  id: number;
  distance: number;
}

@Injectable()
export class FoodRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(where: Prisma.FoodWhereInput) {
    const [data, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              ownerId: true,
              isActive: true,
              profile: {
                select: { openingHours: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
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

    return this.prisma.history.create({
      data: {
        userId,
        foodId,
        restaurantId: food?.restaurantId,
      },
    });
  }

  async findRecentViews(userId: number, limit: number = 5) {
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
    const nearbyResults = await this.prisma.$queryRaw<NearbyResult[]>`
      SELECT f.id, 
        (6371 * acos(cos(radians(${lat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f.lat)))) AS distance
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = ${FoodStatus.APPROVED} 
        AND f.lat IS NOT NULL 
        AND f.lng IS NOT NULL
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f.lat)))) <= ${radius}
      ORDER BY distance ASC
      LIMIT 12
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

  async create(data: Prisma.FoodCreateInput) {
    return this.prisma.food.create({ data });
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

  async findAllFoodsWithRestaurant() {
    return this.prisma.food.findMany({
      where: { deletedAt: null },
      include: {
        restaurant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRestaurantByOwnerId(ownerId: number) {
    return this.prisma.restaurant.findFirst({
      where: { ownerId },
      include: {
        profile: {
          select: { openingHours: true, contactPhone: true },
        },
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

  async updateRestaurantProfile(
    restaurantId: number,
    data: { openingHours?: string; contactPhone?: string },
  ) {
    return this.prisma.restaurantProfile.upsert({
      where: { restaurantId },
      create: { restaurantId, ...data },
      update: data,
    });
  }
}
