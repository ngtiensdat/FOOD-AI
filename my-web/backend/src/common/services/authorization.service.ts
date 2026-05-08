import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Kiểm tra quyền sở hữu đối với Món ăn (Food)
   * logic:
   * - Admin: Có toàn quyền
   * - Restaurant Owner: Chỉ được quản lý món thuộc Nhà hàng mình sở hữu
   * - System Food (restaurantId = null): Chỉ Admin được quản lý
   */
  async checkFoodOwnership(userId: number, role: UserRole, foodId: number) {
    if (role === UserRole.ADMIN) return true;

    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!food) {
      throw new NotFoundException('Món ăn không tồn tại');
    }

    // Nếu là món hệ thống (không thuộc nhà hàng nào)
    if (!food.restaurantId) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý món ăn hệ thống',
      );
    }

    // Kiểm tra ownerId của nhà hàng chứa món ăn này
    if (food.restaurant?.ownerId !== userId) {
      throw new ForbiddenException(
        'Bạn không sở hữu món ăn này hoặc nhà hàng chứa món này',
      );
    }

    return true;
  }

  /**
   * Kiểm tra quyền sở hữu đối với Nhà hàng (Restaurant)
   */
  async checkRestaurantOwnership(
    userId: number,
    role: UserRole,
    restaurantId: number,
  ) {
    if (role === UserRole.ADMIN) return true;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Nhà hàng không tồn tại');
    }

    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException('Bạn không phải chủ sở hữu nhà hàng này');
    }

    return true;
  }
}
