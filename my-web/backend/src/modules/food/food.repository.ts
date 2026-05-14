import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FoodRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(where: Prisma.FoodWhereInput) {
    const [data, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        include: {
          restaurant: {
            select: { id: true, name: true, address: true, ownerId: true },
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
      where: { userId, foodId: { not: null } },
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
          select: { name: true, address: true, ownerId: true },
        },
      },
    });
  }

  async findNearby(lat: number, lng: number, radius: number) {
    const nearbyResults = await this.prisma.$queryRaw`
      SELECT f.id, 
        (6371 * acos(cos(radians(${lat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f.lat)))) AS distance
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = 'APPROVED' 
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
          select: { name: true, address: true, ownerId: true },
        },
      },
    });

    return foods
      .map((f) => {
        const result = nearbyResults.find((r) => r.id === f.id);
        return {
          ...f,
          distance: result ? result.distance : 0,
        };
      })
      .sort((a, b) => a.distance - b.distance);
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
      data: { isActive: false },
    });
  }

  async findRestaurantByOwnerId(ownerId: number) {
    return this.prisma.restaurant.findFirst({
      where: { ownerId },
    });
  }

  async findRestaurantById(id: number) {
    return this.prisma.restaurant.findUnique({
      where: { id },
    });
  }
}
