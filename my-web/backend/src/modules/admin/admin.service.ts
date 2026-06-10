// Mục đích: Cung cấp dịch vụ quản trị hệ thống, xử lý trạng thái người dùng (phê duyệt/từ chối thương gia), quản lý món ăn và điều phối import dữ liệu.
// File quan hệ: Gọi UserRepository, FoodRepository, AiService, MerchantImportService, PrismaService và được gọi bởi AdminController.
// Chức năng đặc biệt: Cập nhật trạng thái người dùng kéo theo cập nhật trạng thái chi nhánh nhà hàng (nếu là thương gia), quản lý bật/tắt Weekly Featured cho món ăn, cập nhật món ăn hàng loạt (batch update) có cập nhật vector embedding tương ứng trong background.
// Kiến thức/Design Pattern: Dependency Injection, SOLID (Single Responsibility - Điều phối quản trị hệ thống, Dependency Inversion), và Transaction Pattern cho batch update.
// Các biến, hàm đặc biệt: getPendingUsers(), updateUserStatus(), getAllFoods(), updateFood(), getAllUsers(), deleteUser(), deleteFood(), importMerchantsFromExcel(), toggleWeeklyFeatured(), batchUpdateFoods().

import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { FoodRepository } from '../food/food.repository';
import { AiService } from '../ai/ai.service';
import { UserRole, UserStatus, Prisma, Food } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantImportService } from './merchant-import.service';
import { MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class AdminService {
  constructor(
    private userRepository: UserRepository,
    private foodRepository: FoodRepository,
    private aiService: AiService,
    private prisma: PrismaService,
    private merchantImportService: MerchantImportService,
  ) {}

  async getPendingUsers() {
    return this.userRepository.findPendingUsers();
  }

  async updateUserStatus(id: number, status: string) {
    if (status !== UserStatus.APPROVED && status !== UserStatus.REJECTED) {
      throw new BadRequestException(MESSAGES.ADMIN.INVALID_STATUS);
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
      tags?: string[];
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
    return this.userRepository.hardDeleteUser(id);
  }

  async deleteFood(id: number) {
    return this.foodRepository.delete(id);
  }

  async importMerchantsFromExcel(buffer: Buffer) {
    return this.merchantImportService.importFromExcel(buffer);
  }

  async toggleWeeklyFeatured(id: number, value: boolean) {
    return this.prisma.food.update({
      where: { id },
      data: { isFeaturedWeekly: value },
    });
  }

  async batchUpdateFoods(
    updates: {
      id: number;
      isFeaturedToday?: boolean;
      isFeaturedWeekly?: boolean;
      isAdminRecommended?: boolean;
    }[],
  ) {
    const results = await this.prisma.$transaction(async (tx) => {
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

    // Cập nhật embedding món ăn trong background sau khi transaction đã commit thành công
    for (const food of results) {
      void this.aiService.updateFoodEmbedding(food.id);
    }

    return results;
  }
}
