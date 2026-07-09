/**
 * Mục đích file này: Định nghĩa service thực hiện nghiệp vụ tạo và kiểm tra đơn hàng (Order) cùng các ràng buộc voucher, giá.
 * Các file khác hay file này có ý nghĩa như nào: Được gọi bởi OrderController, phối hợp với InventoryDeductionService để tự động trừ kho khi đơn hàng hợp lệ.
 * Các chức năng đặc biệt: createOrder (xác thực giá món ăn chống bypass từ client, kiểm tra minSpend/hạn sử dụng của voucher và đánh dấu sử dụng).
 */
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

    // 2.5. Kiểm tra tính toàn vẹn của giá món ăn và tính toán lại tổng tiền (Bảo mật tránh bypass giá)
    const foodIds = dto.items.map((i) => i.foodId);
    const dbFoods = await this.prisma.food.findMany({
      where: {
        id: { in: foodIds },
        restaurantId: dto.restaurantId,
        deletedAt: null,
      },
      select: { id: true, price: true, name: true, isActive: true },
    });

    if (dbFoods.length !== new Set(foodIds).size) {
      throw new BadRequestException(
        'Một hoặc nhiều món ăn không tồn tại hoặc không thuộc chi nhánh nhà hàng này.',
      );
    }

    const inactiveFood = dbFoods.find((f) => !f.isActive);
    if (inactiveFood) {
      throw new BadRequestException(
        `Món ăn "${inactiveFood.name}" hiện đang ngừng kinh doanh.`,
      );
    }

    let expectedSubtotal = 0;
    const foodPriceMap = new Map(dbFoods.map((f) => [f.id, f.price]));

    for (const item of dto.items) {
      const dbPrice = foodPriceMap.get(item.foodId);
      if (dbPrice === undefined) {
        throw new BadRequestException('Món ăn không hợp lệ.');
      }

      // Kiểm tra chênh lệch đơn giá của món ăn gửi từ client
      if (Math.abs(item.price - dbPrice) > 0.01) {
        throw new BadRequestException(
          `Đơn giá của món ăn "${dbFoods.find((f) => f.id === item.foodId)?.name}" không khớp với hệ thống.`,
        );
      }

      expectedSubtotal += dbPrice * item.quantity;
    }

    // Kiểm tra chênh lệch subtotal
    if (Math.abs(dto.subtotal - expectedSubtotal) > 0.01) {
      throw new BadRequestException(
        'Tổng tiền tạm tính (subtotal) không khớp với giá trị trên hệ thống.',
      );
    }

    // Xác minh voucher và tính toán giảm giá thực tế trên server
    let expectedDiscount = 0;
    if (dto.voucherCode) {
      const userVoucher = await this.prisma.userVoucher.findUnique({
        where: { code: dto.voucherCode },
        include: { voucher: true },
      });

      if (!userVoucher) {
        throw new BadRequestException(
          'Mã voucher không tồn tại hoặc không hợp lệ.',
        );
      }

      if (userVoucher.isUsed) {
        throw new BadRequestException('Voucher này đã được sử dụng trước đó.');
      }

      const voucher = userVoucher.voucher;

      // Kiểm tra xem voucher có áp dụng được tại restaurant này không
      const isVoucherApplicable =
        voucher.restaurantId === dto.restaurantId ||
        (voucher.restaurantId === null &&
          (voucher.applicableRestaurantIds.length === 0 ||
            voucher.applicableRestaurantIds.includes(dto.restaurantId)));

      if (!isVoucherApplicable) {
        throw new BadRequestException(
          'Voucher này không được áp dụng tại chi nhánh nhà hàng này.',
        );
      }

      // Kiểm tra hạn sử dụng của voucher
      const now = new Date();
      const isExpiredDate = voucher.expiryDate && now > voucher.expiryDate;
      const expiryLimit = new Date(
        userVoucher.redeemedAt.getTime() +
          voucher.expiryDays * 24 * 60 * 60 * 1000,
      );
      const isExpiredDays = now > expiryLimit;

      if (isExpiredDate || isExpiredDays) {
        throw new BadRequestException('Voucher này đã hết hạn sử dụng.');
      }

      // Kiểm tra chi tiêu tối thiểu (minSpend)
      let minSpendValue = 0;
      if (voucher.minSpend) {
        minSpendValue = Number(voucher.minSpend.replace(/[^0-9]/g, '')) || 0;
      }
      if (expectedSubtotal < minSpendValue) {
        throw new BadRequestException(
          `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minSpend} để áp dụng voucher này.`,
        );
      }

      // Tính toán giá trị giảm giá
      const discountValStr = voucher.discountValue;
      if (discountValStr.includes('%')) {
        const percent = Number(discountValStr.replace(/[^0-9]/g, '')) || 0;
        expectedDiscount = (expectedSubtotal * percent) / 100;
      } else {
        expectedDiscount = Number(discountValStr.replace(/[^0-9]/g, '')) || 0;
      }
    }

    // Kiểm tra chênh lệch discount
    if (Math.abs(dto.discount - expectedDiscount) > 0.01) {
      throw new BadRequestException(
        'Số tiền giảm giá (discount) không khớp với hệ thống.',
      );
    }

    // Tính toán tổng số tiền thanh toán cuối cùng
    const expectedTotal = Math.max(0, expectedSubtotal - expectedDiscount);

    // Kiểm tra chênh lệch tổng tiền
    if (Math.abs(dto.total - expectedTotal) > 0.01) {
      throw new BadRequestException(
        'Tổng tiền thanh toán cuối cùng (total) không khớp với giá trị hệ thống.',
      );
    }

    // 3. Tạo đơn hàng và đánh dấu voucher đã sử dụng trong một transaction duy nhất (Atomic Transaction)
    const order = await this.prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
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

      // Đánh dấu voucher đã sử dụng để tránh race condition hoặc reuse
      if (dto.voucherCode) {
        await tx.userVoucher.update({
          where: { code: dto.voucherCode },
          data: {
            isUsed: true,
            usedAt: new Date(),
          },
        });

        // Tăng usedCount của voucher gốc
        const userVoucher = await tx.userVoucher.findUnique({
          where: { code: dto.voucherCode },
          select: { voucherId: true },
        });
        if (userVoucher) {
          await tx.voucher.update({
            where: { id: userVoucher.voucherId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return ord;
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
