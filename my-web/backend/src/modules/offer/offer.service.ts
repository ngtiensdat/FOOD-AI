import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  async getAllOffers(promoType?: string, restaurantId?: number) {
    const where: Prisma.OfferWhereInput = {};
    if (promoType && promoType !== 'ALL') {
      where.promoType = promoType;
    }
    if (restaurantId !== undefined) {
      where.restaurantId = restaurantId;
    }
    return this.prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOffer(userId: number, role: UserRole, dto: CreateOfferDto) {
    let rId: number | null = null;
    let rName: string | null = 'Hệ thống FOOD AI';

    if (role === UserRole.ADMIN) {
      if (dto.restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: dto.restaurantId },
          select: { id: true, name: true },
        });
        if (!restaurant) {
          throw new NotFoundException('Không tìm thấy nhà hàng được chọn');
        }
        rId = restaurant.id;
        rName = restaurant.name;
      } else if (dto.restaurantName) {
        rName = dto.restaurantName;
      }
    } else {
      // Check if user has a restaurant
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: userId },
      });

      if (!restaurant) {
        throw new ForbiddenException(
          'Bạn không sở hữu cửa hàng nào để đăng khuyến mãi',
        );
      }
      rId = restaurant.id;
      rName = restaurant.name;
    }

    const offer = await this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        promoType: dto.promoType,
        discountValue: dto.discountValue,
        restaurantName: rName,
        restaurantId: rId,
        image: dto.image,
        validUntil: dto.validUntil,
        promoCode: dto.promoCode,
        terms: dto.terms,
        quantity: dto.quantity !== undefined ? Number(dto.quantity) : 100,
        usedCount: 0,
      },
    });

    return offer;
  }

  async updateOffer(
    userId: number,
    role: UserRole,
    offerId: number,
    dto: UpdateOfferDto,
  ) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Không tìm thấy khuyến mãi');
    }

    // Role and ownership check
    if (role !== UserRole.ADMIN) {
      if (offer.restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: offer.restaurantId },
          select: { ownerId: true },
        });
        if (!restaurant || restaurant.ownerId !== userId) {
          throw new ForbiddenException(
            'Bạn không có quyền chỉnh sửa khuyến mãi này',
          );
        }
      } else {
        throw new ForbiddenException(
          'Bạn không có quyền chỉnh sửa khuyến mãi hệ thống',
        );
      }
    }

    const updateData: any = {
      title: dto.title !== undefined ? dto.title : offer.title,
      description:
        dto.description !== undefined ? dto.description : offer.description,
      promoType: dto.promoType !== undefined ? dto.promoType : offer.promoType,
      discountValue:
        dto.discountValue !== undefined
          ? dto.discountValue
          : offer.discountValue,
      image: dto.image !== undefined ? dto.image : offer.image,
      validUntil:
        dto.validUntil !== undefined ? dto.validUntil : offer.validUntil,
      promoCode: dto.promoCode !== undefined ? dto.promoCode : offer.promoCode,
      terms: dto.terms !== undefined ? dto.terms : offer.terms,
      quantity:
        dto.quantity !== undefined
          ? dto.quantity
            ? Number(dto.quantity)
            : null
          : offer.quantity,
    };

    if (role === UserRole.ADMIN) {
      if (dto.restaurantId !== undefined) {
        if (dto.restaurantId) {
          const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
            select: { id: true, name: true },
          });
          if (!restaurant) {
            throw new NotFoundException('Không tìm thấy nhà hàng được chọn');
          }
          updateData.restaurantId = restaurant.id;
          updateData.restaurantName = restaurant.name;
        } else {
          updateData.restaurantId = null;
          updateData.restaurantName = dto.restaurantName || 'Hệ thống FOOD AI';
        }
      }
    }

    return this.prisma.offer.update({
      where: { id: offerId },
      data: updateData,
    });
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
