import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AiService } from '../ai/ai.service';
import { UserRole, UserStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private userRepository: UserRepository,
    private aiService: AiService,
    private prisma: PrismaService, // Dùng cho food và restaurant queries
  ) {}

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.RESTAURANT,
        status: UserStatus.PENDING,
      },
      select: {
        id: true,
        name: true,
        email: true,
        legalDocuments: true,
        createdAt: true,
      },
    });
  }

  async updateUserStatus(id: number, status: string) {
    if (status !== UserStatus.APPROVED && status !== UserStatus.REJECTED) {
      throw new UnauthorizedException('Trạng thái không hợp lệ');
    }

    const updatedUser = await this.userRepository.update(id, {
      status: status,
    });

    if (updatedUser.role === UserRole.RESTAURANT) {
      await this.prisma.restaurant.updateMany({
        where: { ownerId: id },
        data: { isActive: status === UserStatus.APPROVED },
      });
    }

    return updatedUser;
  }

  async getAllFoods() {
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

  async updateFood(
    id: number,
    data: {
      name?: string;
      price?: string | number;
      description?: string;
      image?: string;
      isActive?: boolean;
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

    const updatedFood = await this.prisma.food.update({
      where: { id },
      data: formattedData,
    });

    await this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  async getAllUsers(role?: string) {
    return this.prisma.user.findMany({
      where: {
        role: role ? (role.toUpperCase() as UserRole) : undefined,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUser(id: number) {
    return this.userRepository.update(id, { deletedAt: new Date() });
  }

  async deleteFood(id: number) {
    return this.prisma.food.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
