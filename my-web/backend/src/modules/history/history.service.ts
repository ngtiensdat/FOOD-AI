/**
 * Mục đích file này: Định nghĩa service quản lý lịch sử đơn hàng, ca làm việc nhân viên và báo cáo doanh số trong SQLite.
 * Các file khác hay file này có ý nghĩa như thế nào: Được gọi bởi HistoryController, kết nối trực tiếp với InventoryPrismaService để lấy thông tin lưu vết.
 * Các chức năng đặc biệt: getOrderHistories, getStaffShifts, getDailySales, clockIn, clockOut.
 */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InventoryPrismaService } from '../../database/inventory-prisma.service';
import { PrismaService } from '../../database/prisma.service';
import * as PrismaClient from '@prisma/client';

@Injectable()
export class HistoryService {
  constructor(
    private readonly inventoryPrisma: InventoryPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  /** Helper: Xác định restaurantId hợp lệ từ user */
  async resolveRestaurantId(
    user: PrismaClient.User,
    explicitId?: string,
  ): Promise<number> {
    if (user.role === PrismaClient.UserRole.ADMIN) {
      if (!explicitId)
        throw new ForbiddenException('Admin phải chỉ định restaurantId.');
      return parseInt(explicitId, 10);
    }
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!restaurant)
      throw new ForbiddenException('Không tìm thấy nhà hàng thuộc về bạn.');
    return explicitId ? parseInt(explicitId, 10) : restaurant.id;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ORDER HISTORY
  // ──────────────────────────────────────────────────────────────────────────

  async getOrderHistories(restaurantId: number, limit = 100, offset = 0) {
    return this.inventoryPrisma.orderHistory.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async createOrderHistory(
    restaurantId: number,
    data: {
      orderId: number;
      tableId?: number;
      tableName?: string;
      staffId?: number;
      staffName?: string;
      subtotal: number;
      discount: number;
      total: number;
      voucherCode?: string;
      paymentMethod?: string;
      status?: string;
      items: {
        foodId: number;
        foodName: string;
        quantity: number;
        price: number;
      }[];
    },
  ) {
    const { items, ...orderData } = data;
    return this.inventoryPrisma.orderHistory.create({
      data: {
        ...orderData,
        restaurantId,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAFF SHIFTS
  // ──────────────────────────────────────────────────────────────────────────

  async getStaffShifts(restaurantId: number, limit = 100, offset = 0) {
    return this.inventoryPrisma.staffShift.findMany({
      where: { restaurantId },
      orderBy: { clockIn: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async clockIn(
    restaurantId: number,
    data: {
      staffId: number;
      staffName: string;
      terminalId?: number;
      terminalName?: string;
    },
  ) {
    return this.inventoryPrisma.staffShift.create({
      data: { ...data, restaurantId, clockIn: new Date() },
    });
  }

  async clockOut(
    shiftId: string,
    restaurantId: number,
    data: {
      totalOrders?: number;
      totalRevenue?: number;
    },
  ) {
    return this.inventoryPrisma.staffShift.updateMany({
      where: { id: shiftId, restaurantId },
      data: { clockOut: new Date(), ...data },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DAILY SALES SUMMARIES
  // ──────────────────────────────────────────────────────────────────────────

  async getDailySales(restaurantId: number, from?: string, to?: string) {
    const where: any = { restaurantId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }
    return this.inventoryPrisma.dailySalesSummary.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 90,
    });
  }

  async upsertDailySales(
    restaurantId: number,
    date: string,
    data: {
      totalRevenue?: number;
      totalOrders?: number;
      cancelledOrders?: number;
      cashRevenue?: number;
      transferRevenue?: number;
      totalDiscount?: number;
    },
  ) {
    return this.inventoryPrisma.dailySalesSummary.upsert({
      where: { restaurantId_date: { restaurantId, date } },
      create: { restaurantId, date, ...data },
      update: data,
    });
  }
}
