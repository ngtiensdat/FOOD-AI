import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
}
