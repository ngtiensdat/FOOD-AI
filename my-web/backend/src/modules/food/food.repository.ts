import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FoodStatus, Food } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';

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
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      select: { restaurantId: true },
    });

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
      distinct: ['foodId'],
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
    const latDelta = radius / KM_PER_LATITUDE_DEGREE;
    const lngDelta =
      radius / (KM_PER_LATITUDE_DEGREE * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

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
