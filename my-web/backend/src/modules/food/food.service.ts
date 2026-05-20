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
    // 1. Kiểm tra xem cơ sở (Restaurant) được chọn có thuộc quyền sở hữu của Merchant không
    const restaurant = await this.repository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException('Cơ sở không tồn tại.');

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
      restaurant: { connect: { id: dto.restaurantId } },
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
    if (!food) throw new NotFoundException('Món ăn không tồn tại');

    // Rule 5 - Security & Ownership
    if (
      user.role === UserRole.RESTAURANT &&
      food.restaurant?.ownerId !== user.id
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa món ăn này');
    }

    return this.repository.delete(id);
  }

  async approveFood(id: number, status: FoodStatus) {
    return this.repository.update(id, { status });
  }
  async getMyRestaurant(user: User) {
    const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
    if (!restaurant) {
      throw new NotFoundException('Bạn chưa sở hữu cơ sở kinh doanh nào.');
    }
    return restaurant;
  }

  async updateMyRestaurantStatus(user: User, isActive: boolean) {
    const restaurant = await this.repository.findRestaurantByOwnerId(user.id);
    if (!restaurant) {
      throw new NotFoundException('Bạn chưa sở hữu cơ sở kinh doanh nào.');
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
      throw new NotFoundException('Bạn chưa sở hữu cơ sở kinh doanh nào.');
    }
    return this.repository.updateRestaurantProfile(restaurant.id, {
      openingHours,
      contactPhone,
    });
  }
}
