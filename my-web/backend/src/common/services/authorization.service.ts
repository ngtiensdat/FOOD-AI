// Mục đích: Cung cấp các hàm kiểm tra quyền hạn (Authorization) mức độ chuyên sâu (Resource Ownership).
// Ý nghĩa: Tránh lỗi IDOR (Insecure Direct Object Reference) bằng cách kiểm tra user có phải chủ sở hữu tài nguyên không.
// Chức năng đặc biệt: Tách biệt logic kiểm tra quyền sở hữu khỏi Controller và Repository.
// Kiến thức/Design Pattern: Service Pattern, Separation of Concerns (SOLID - Tách logic phân quyền khỏi logic nghiệp vụ chính).
// Biến/hàm đặc biệt: Hàm checkFoodOwnership và checkRestaurantOwnership xử lý logic owner vs admin.
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { MESSAGES } from '../constants/messages.constant';

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
      throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);
    }

    // Nếu là món hệ thống (không thuộc nhà hàng nào)
    if (!food.restaurantId) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_SYSTEM_MANAGE);
    }

    // Kiểm tra ownerId của nhà hàng chứa món ăn này
    if (food.restaurant?.ownerId !== userId) {
      throw new ForbiddenException(MESSAGES.FOOD.NOT_OWNER_OF_FOOD);
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
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException(MESSAGES.RESTAURANT.NOT_OWNER_OF_THIS);
    }

    return true;
  }
}
