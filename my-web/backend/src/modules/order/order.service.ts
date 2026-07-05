import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryDeductionService } from '../inventory/inventory-deduction.service';
import { UserRole, type User } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryDeductionService: InventoryDeductionService,
  ) {}

  async createOrder(dto: CreateOrderDto, user: User) {
    // 1. Kiểm tra tính hợp lệ của TableId đối với RestaurantId
    if (dto.tableId) {
      const table = await this.prisma.diningTable.findUnique({
        where: { id: dto.tableId },
        select: { restaurantId: true },
      });
      if (!table || table.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(
          'Bàn ăn được chọn không thuộc về chi nhánh nhà hàng này.',
        );
      }
    }

    // 2. Kiểm tra vai trò & Quyền sở hữu (IDOR Check khi tạo đơn hàng)
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: dto.restaurantId },
        select: { ownerId: true },
      });
      if (!restaurant || restaurant.ownerId !== user.id) {
        throw new ForbiddenException(
          'Bạn không có quyền tạo hóa đơn cho nhà hàng này.',
        );
      }
    } else if (user.role === UserRole.STAFF) {
      if (user.restaurantId !== dto.restaurantId) {
        throw new ForbiddenException(
          'Bạn không có quyền tạo hóa đơn cho chi nhánh khác.',
        );
      }
    }

    // 3. Tạo đơn hàng và chi tiết đơn hàng trong PostgreSQL
    const order = await this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        tableId: dto.tableId || null,
        voucherCode: dto.voucherCode || null,
        subtotal: dto.subtotal,
        discount: dto.discount,
        total: dto.total,
        items: {
          create: dto.items.map((item) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 4. Kích hoạt luồng trừ kho tự động ở SQLite thông qua InventoryDeductionService
    try {
      const deductItems = dto.items.map((item) => ({
        foodId: item.foodId,
        quantity: item.quantity,
      }));
      await this.inventoryDeductionService.deductIngredientsForOrder(
        dto.restaurantId,
        deductItems,
      );
    } catch (error) {
      console.error('Lỗi khi thực hiện trừ kho tự động:', error);
    }

    return order;
  }

  async getOrdersByRestaurant(restaurantId: number, user: User) {
    // Kiểm tra vai trò & Quyền truy cập thông tin hóa đơn (IDOR Check)
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { ownerId: true },
      });
      if (!restaurant || restaurant.ownerId !== user.id) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập báo cáo hóa đơn của nhà hàng này.',
        );
      }
    } else if (user.role === UserRole.STAFF) {
      if (user.restaurantId !== restaurantId) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập báo cáo hóa đơn của chi nhánh này.',
        );
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Chỉ ADMIN, Chủ nhà hàng hoặc Nhân viên được cấp quyền mới được xem lịch sử hóa đơn.',
      );
    }

    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            food: true,
          },
        },
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
