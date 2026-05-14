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

@Injectable()
export class FoodService {
  constructor(
    private repository: FoodRepository,
    private aiService: AiService,
  ) {}

  async getAllFoods(query: FoodQueryDto) {
    const { tag } = query;
    const where: Prisma.FoodWhereInput = {
      isActive: true,
      status: FoodStatus.APPROVED,
      OR: [{ restaurantId: null }, { restaurant: { is: { isActive: true } } }],
    };
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

  async getRecentFoods(user: User) {
    if (!user) return [];
    return this.repository.findRecentViews(user.id);
  }

  async getNearbyFoods(query: FoodQueryDto) {
    const { lat, lng, radius } = query;
    if (lat === undefined || lng === undefined) return [];
    return this.repository.findNearby(lat, lng, radius || 10);
  }

  async createFood(user: User, dto: CreateFoodDto) {
    let finalRestaurantId: number | null = null;

    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
      if (!restaurant)
        throw new ForbiddenException('Bạn chưa đăng ký nhà hàng.');
      finalRestaurantId = restaurant.id;
    } else {
      finalRestaurantId = dto.restaurantId || null;
    }

    let { lat, lng } = dto;
    if (finalRestaurantId && (!lat || !lng)) {
      const restaurant =
        await this.repository.findRestaurantById(finalRestaurantId);
      if (restaurant) {
        lat = lat || restaurant.latitude;
        lng = lng || restaurant.longitude;
      }
    }

    const food = await this.repository.create({
      name: dto.name,
      price: dto.price,
      description: dto.description,
      image: dto.image,
      tags: dto.tags || [],
      lat,
      lng,
      restaurant: finalRestaurantId
        ? { connect: { id: finalRestaurantId } }
        : undefined,
      status:
        user.role === UserRole.ADMIN ? FoodStatus.APPROVED : FoodStatus.PENDING,
      isActive: true,
    });

    void this.aiService.updateFoodEmbedding(food.id);
    return food;
  }

  async updateFood(user: User, id: number, dto: UpdateFoodDto) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException('Món ăn không tồn tại');

    // Kiểm tra quyền sở hữu (Rule 5 - Security & Ownership)
    if (user.role === UserRole.RESTAURANT) {
      if (food.restaurant?.ownerId !== user.id) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa món ăn này');
      }
    }

    // Update status to PENDING if merchant updates
    const data: Prisma.FoodUpdateInput = { ...dto };
    if (user.role === UserRole.RESTAURANT) {
      data.status = FoodStatus.PENDING;
    }

    const updatedFood = await this.repository.update(id, data);
    void this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  async toggleRecommend(id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException('Món ăn không tồn tại');

    return this.repository.update(id, {
      isAdminRecommended: !food.isAdminRecommended,
    });
  }

  async getFeaturedToday() {
    const result = await this.repository.findAll({
      isFeaturedToday: true,
      isActive: true,
      status: FoodStatus.APPROVED,
    });
    return result.data;
  }

  async getFeaturedWeekly() {
    const result = await this.repository.findAll({
      isFeaturedWeekly: true,
      isActive: true,
      status: FoodStatus.APPROVED,
    });
    return result.data;
  }

  async getRecommended() {
    const result = await this.repository.findAll({
      isAdminRecommended: true,
      isActive: true,
      status: FoodStatus.APPROVED,
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
    const where: Prisma.FoodWhereInput = {};
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
      if (!restaurant) return [];
      where.restaurantId = restaurant.id;
    }
    const result = await this.repository.findAll(where);
    return result.data;
  }

  async approveFood(id: number, status: FoodStatus) {
    return this.repository.update(id, { status });
  }
}
