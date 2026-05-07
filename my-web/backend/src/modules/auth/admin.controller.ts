import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) { }

  // Lấy danh sách người dùng đang chờ duyệt (Dành cho Admin)
  @Get('pending-users')
  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        role: 'RESTAURANT',
        status: 'PENDING'
      },
      select: {
        id: true,
        name: true,
        email: true,
        legalDocuments: true,
        createdAt: true,
      }
    });
  }

  // Phê duyệt hoặc Từ chối tài khoản
  @Patch('update-status/:id')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const { status } = body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new UnauthorizedException('Trạng thái không hợp lệ');
    }

    return this.prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: status as any }
    });
  }

  // Lấy toàn bộ danh sách món ăn từ tất cả thương gia
  @Get('all-foods')
  async getAllFoods() {
    return this.prisma.food.findMany({
      include: {
        restaurant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Cập nhật trạng thái nổi bật của món ăn
  @Patch('update-food/:id')
  async updateFoodStatus(
    @Param('id') id: string,
    @Body() body: any
  ) {
    const data = { ...body };
    if (data.price) data.price = parseFloat(data.price);
    if (data.restaurantId) data.restaurantId = parseInt(data.restaurantId);
    
    return this.prisma.food.update({
      where: { id: parseInt(id) },
      data
    });
  }

  // --- QUẢN LÝ NGƯỜI DÙNG & THƯƠNG GIA ---
  
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
      orderBy: { createdAt: 'desc' }
    });
  }

  @Delete('user/:id')
  async deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id: parseInt(id) }
    });
  }

  @Delete('food/:id')
  async deleteFood(@Param('id') id: string) {
    return this.prisma.food.delete({
      where: { id: parseInt(id) }
    });
  }
}
