import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserRole, UserStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InventoryPrismaService } from '../../database/inventory-prisma.service';

@Injectable()
export class InventoryDeductionService {
  private readonly logger = new Logger(InventoryDeductionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryPrisma: InventoryPrismaService,
  ) {}

  /**
   * Tự động trừ kho nguyên liệu dựa trên công thức món ăn khi có đơn hàng được bán ra.
   * @param restaurantId ID của chi nhánh nhà hàng
   * @param items Danh sách các món ăn bán ra và số lượng
   */
  async deductIngredientsForOrder(
    restaurantId: number,
    items: { foodId: number; quantity: number }[],
  ) {
    this.logger.log(
      `Bắt đầu trừ tồn kho cho chi nhánh ${restaurantId}, số món ăn: ${items.length}`,
    );

    for (const item of items) {
      // 1. Lấy thông tin món ăn từ PG DB để ghi log chi tiết
      const food = await this.prisma.food.findUnique({
        where: { id: item.foodId },
        select: { name: true },
      });
      const foodName = food?.name || `Món ăn #${item.foodId}`;

      // 2. Tìm tất cả công thức quy đổi của món này trong SQLite
      const recipes = await this.inventoryPrisma.recipeItem.findMany({
        where: { foodId: item.foodId },
        include: { ingredient: true },
      });

      if (recipes.length === 0) {
        this.logger.warn(
          `Món ăn "${foodName}" không có công thức định lượng quy đổi. Bỏ qua trừ kho.`,
        );
        continue;
      }

      // 3. Thực hiện cập nhật trừ kho từng nguyên liệu trong SQLite
      for (const recipe of recipes) {
        const neededQty = recipe.usedQuantity * item.quantity;
        const ingredientId = recipe.ingredientId;
        const ingredientName = recipe.ingredient.name;

        await this.inventoryPrisma.$transaction(async (tx) => {
          // Trừ số lượng tồn kho
          const updatedIngredient = await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              quantity: {
                decrement: neededQty,
              },
            },
          });

          if (updatedIngredient.quantity < 0) {
            throw new BadRequestException(
              `Nguyên liệu "${ingredientName}" không đủ để hoàn thành món ăn này (cần ${neededQty} ${recipe.ingredient.unit}, hiện có ${(updatedIngredient.quantity + neededQty).toFixed(2)} ${recipe.ingredient.unit}).`,
            );
          }

          // Ghi nhật ký xuất kho
          await tx.inventoryLog.create({
            data: {
              ingredientId,
              type: 'ORDER_DEDUCTION',
              quantity: -neededQty,
              note: `Bán món "${foodName}" x${item.quantity} (Tiêu hao ${neededQty} ${recipe.ingredient.unit})`,
            },
          });

          // 4. Cảnh báo hết hàng nếu tồn kho chạm hoặc dưới ngưỡng minStock
          if (updatedIngredient.quantity <= updatedIngredient.minStock) {
            this.logger.warn(
              `Nguyên liệu "${ingredientName}" sắp hết! Hiện tại: ${updatedIngredient.quantity} ${updatedIngredient.unit}`,
            );
            await this.createLowStockNotification(
              restaurantId,
              ingredientName,
              updatedIngredient.quantity,
              updatedIngredient.unit,
            );
          }
        });
      }
    }
  }

  /**
   * Tạo thông báo cảnh báo tồn kho thấp cho Chủ cửa hàng (Owner) và các Nhân viên (Staff).
   */
  private async createLowStockNotification(
    restaurantId: number,
    ingredientName: string,
    currentQty: number,
    unit: string,
  ) {
    try {
      // 1. Tìm thông tin nhà hàng và các nhân viên liên quan
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          owner: true,
          staffs: {
            where: { role: UserRole.STAFF, status: UserStatus.APPROVED },
          },
        },
      });

      if (!restaurant) return;

      const title = `⚠️ Cảnh báo tồn kho thấp`;
      const content = `Nguyên liệu "${ingredientName}" tại chi nhánh "${restaurant.name}" đang ở mức cảnh báo! Còn lại: ${currentQty.toFixed(2)} ${unit}. Vui lòng nhập hàng thêm.`;

      // 2. Thu thập danh sách userId cần thông báo (owner + tất cả staff)
      const recipientIds: number[] = [];
      if (restaurant.owner) {
        recipientIds.push(restaurant.owner.id);
      }
      for (const staff of restaurant.staffs) {
        recipientIds.push(staff.id);
      }

      // 3. Gửi tất cả thông báo bằng một lần ghi duy nhất (tránh N+1 queries)
      if (recipientIds.length > 0) {
        await this.prisma.notification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            type: NotificationType.SYSTEM,
            title,
            content,
          })),
        });
      }
    } catch (error) {
      this.logger.error('Không thể tạo thông báo tồn kho thấp:', error);
    }
  }
}
