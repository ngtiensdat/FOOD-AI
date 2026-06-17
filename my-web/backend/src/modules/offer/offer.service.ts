import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  async getAllOffers(promoType?: string) {
    const where: any = {};
    if (promoType && promoType !== 'ALL') {
      where.promoType = promoType;
    }
    return this.prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOffer(
    userId: number,
    dto: {
      title: string;
      description: string;
      promoType: string;
      discountValue: string;
      restaurantName: string;
      restaurantId?: number;
      image: string;
      validUntil: string;
    },
  ) {
    // Check if user has a restaurant
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        'Bạn không sở hữu cửa hàng nào để đăng khuyến mãi',
      );
    }

    const offer = await this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        promoType: dto.promoType,
        discountValue: dto.discountValue,
        restaurantName: restaurant.name,
        restaurantId: restaurant.id,
        image: dto.image,
        validUntil: dto.validUntil,
      },
    });

    return offer;
  }

  async deleteOffer(userId: number, role: UserRole, offerId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Không tìm thấy khuyến mãi');
    }

    let isAuthorized = false;
    if (role === UserRole.ADMIN) {
      isAuthorized = true;
    } else if (offer.restaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: offer.restaurantId },
        select: { ownerId: true },
      });
      if (restaurant && restaurant.ownerId === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('Bạn không có quyền xóa khuyến mãi này');
    }

    await this.prisma.offer.delete({
      where: { id: offerId },
    });

    return { success: true };
  }
}
