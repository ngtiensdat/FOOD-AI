import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // Lấy danh sách người dùng đang chờ duyệt
  @Get('pending-users')
  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.RESTAURANT,
        status: 'PENDING',
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

  // Phê duyệt hoặc Từ chối tài khoản
  @Patch('update-status/:id')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const { status } = body;
    const userId = parseInt(id);

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new UnauthorizedException('Trạng thái không hợp lệ');
    }

    // 1. Cập nhật trạng thái User
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });

    // 2. Đồng bộ trạng thái Nhà hàng
    if (updatedUser.role === UserRole.RESTAURANT) {
      await this.prisma.restaurant.updateMany({
        where: { ownerId: userId },
        data: { isActive: status === 'APPROVED' },
      });
      console.log(
        `[ADMIN] Đã đồng bộ isActive cho nhà hàng của User ID: ${userId} (${status})`,
      );
    }

    return updatedUser;
  }

  @Get('all-foods')
  async getAllFoods() {
    return this.prisma.food.findMany({
      include: {
        restaurant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('update-food/:id')
  async updateFoodStatus(@Param('id') id: string, @Body() body: any) {
    const data = { ...body };
    if (data.price) data.price = parseFloat(data.price);
    if (data.restaurantId) data.restaurantId = parseInt(data.restaurantId);
    if (data.lat) data.lat = parseFloat(data.lat);
    if (data.lng) data.lng = parseFloat(data.lng);

    const updatedFood = await this.prisma.food.update({
      where: { id: parseInt(id) },
      data,
    });

    this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  @Get('users')
  async getAllUsers(@Query('role') role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role.toUpperCase() as any } : {},
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

  @Delete('user/:id')
  async deleteUser(@Param('id') id: string) {
    return this.prisma.user.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
  }

  @Delete('food/:id')
  async deleteFood(@Param('id') id: string) {
    return this.prisma.food.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
