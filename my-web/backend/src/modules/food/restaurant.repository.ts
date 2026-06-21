// Mục đích: Lớp Repository đóng gói toàn bộ truy vấn DB liên quan đến Restaurant.
// Ý nghĩa: Tách biệt logic truy cập dữ liệu nhà hàng khỏi tầng Service, tuân thủ nguyên tắc SRP (SOLID).
// Chức năng đặc biệt: Tính khoảng cách nhà hàng gần đây bằng công thức Haversine qua raw SQL, xử lý cập nhật profile nhà hàng trong Transaction.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FoodStatus } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';

export interface NearbyResult {
  id: number;
  distance: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_LATITUDE_DEGREE = 111.045;

@Injectable()
export class RestaurantRepository {
  constructor(private prisma: PrismaService) {}

  async findNearbyRestaurants(lat: number, lng: number, radius: number) {
    const latDelta = radius / KM_PER_LATITUDE_DEGREE;
    const lngDelta =
      radius / (KM_PER_LATITUDE_DEGREE * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

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
        owner: {
          select: {
            badgeTitle: true,
          },
        },
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
        owner: {
          select: {
            badgeTitle: true,
          },
        },
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
          owner: {
            select: {
              badgeTitle: true,
            },
          },
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
}
