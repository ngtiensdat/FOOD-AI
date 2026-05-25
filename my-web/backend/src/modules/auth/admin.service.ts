import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { FoodRepository } from '../food/food.repository';
import { AiService } from '../ai/ai.service';
import { UserRole, UserStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private userRepository: UserRepository,
    private foodRepository: FoodRepository,
    private aiService: AiService,
  ) {}

  async getPendingUsers() {
    return this.userRepository.findPendingUsers();
  }

  async updateUserStatus(id: number, status: string) {
    if (status !== UserStatus.APPROVED && status !== UserStatus.REJECTED) {
      throw new UnauthorizedException('Trạng thái không hợp lệ');
    }

    const updatedUser = await this.userRepository.update(id, {
      status: status,
    });

    if (updatedUser.role === UserRole.RESTAURANT) {
      await this.userRepository.updateRestaurantsStatus(
        id,
        status === UserStatus.APPROVED,
      );
    }

    return updatedUser;
  }

  async getAllFoods() {
    return this.foodRepository.findAllFoodsWithRestaurant();
  }

  async updateFood(
    id: number,
    data: {
      name?: string;
      price?: string | number;
      description?: string;
      image?: string;
      isActive?: boolean;
      isFeaturedToday?: boolean;
      isAdminRecommended?: boolean;
      lat?: string | number;
      lng?: string | number;
      address?: string;
    },
  ) {
    const formattedData: Prisma.FoodUpdateInput = {
      ...data,
    } as Prisma.FoodUpdateInput;
    if (data.price !== undefined)
      formattedData.price = parseFloat(data.price.toString());
    if (data.lat !== undefined)
      formattedData.lat = parseFloat(data.lat.toString());
    if (data.lng !== undefined)
      formattedData.lng = parseFloat(data.lng.toString());

    const updatedFood = await this.foodRepository.update(id, formattedData);

    await this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  async getAllUsers(role?: string) {
    return this.userRepository.findAllUsers(
      role ? (role.toUpperCase() as UserRole) : undefined,
    );
  }

  async deleteUser(id: number) {
    return this.userRepository.update(id, { deletedAt: new Date() });
  }

  async deleteFood(id: number) {
    return this.foodRepository.delete(id);
  }
}
