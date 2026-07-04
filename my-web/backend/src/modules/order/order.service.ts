import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryDeductionService } from '../inventory/inventory-deduction.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryDeductionService: InventoryDeductionService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // 1. Tạo đơn hàng và chi tiết đơn hàng trong PostgreSQL
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

    // 2. Kích hoạt luồng trừ kho tự động ở SQLite thông qua InventoryDeductionService
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

  async getOrdersByRestaurant(restaurantId: number) {
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
