import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GamificationQueueService } from '../badge/gamification-queue.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GeneratePointCodeDto, ClaimPointCodeDto } from './dto/point-code.dto';

@Injectable()
export class VoucherService {
  constructor(
    private prisma: PrismaService,
    private gamificationQueue: GamificationQueueService,
  ) {}

  async getAllVouchers(restaurantId?: number) {
    const where: { restaurantId?: number } = {};
    if (restaurantId !== undefined) {
      where.restaurantId = restaurantId;
    }
    return this.prisma.voucher.findMany({
      where,
      orderBy: { pointsCost: 'asc' },
    });
  }

  async getMyVouchers(userId: number) {
    const redeemed = await this.prisma.userVoucher.findMany({
      where: { userId },
      include: { voucher: true },
      orderBy: { redeemedAt: 'desc' },
    });

    return redeemed.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.voucher.title,
      description: r.voucher.description,
      image: r.voucher.image,
      redeemedAt: r.redeemedAt.toISOString(),
      expiryDays: r.voucher.expiryDays,
      expiryDate: r.voucher.expiryDate
        ? r.voucher.expiryDate.toISOString()
        : null,
      isUsed: r.isUsed,
    }));
  }

  async createVoucher(userId: number, role: string, dto: CreateVoucherDto) {
    let rId: number | null = null;
    let rName: string | null = 'Hệ thống FOOD AI';
    let appRestIds: number[] = [];

    if (role === 'ADMIN') {
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
      } else if (dto.applicableRestaurantIds) {
        appRestIds = dto.applicableRestaurantIds;
      }
    } else {
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: userId },
        select: { id: true, name: true },
      });

      if (!restaurant) {
        throw new ForbiddenException(
          'Bạn không sở hữu cửa hàng nào để tạo voucher',
        );
      }
      rId = restaurant.id;
      rName = restaurant.name;
    }

    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${dto.promoType}_${randSuffix}`;

    // Dynamic image mapping based on keywords in title
    const t = dto.title.toLowerCase();
    let mappedImage =
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'; // general default
    if (t.includes('pizza')) {
      mappedImage =
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
    } else if (
      t.includes('gà') ||
      t.includes('chicken') ||
      t.includes('burger')
    ) {
      mappedImage =
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
    } else if (
      t.includes('nước') ||
      t.includes('uống') ||
      t.includes('trà') ||
      t.includes('sữa') ||
      t.includes('pepsi') ||
      t.includes('coca') ||
      t.includes('nước ngọt')
    ) {
      mappedImage =
        'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80';
    } else if (
      t.includes('ngọt') ||
      t.includes('bánh') ||
      t.includes('flan') ||
      t.includes('tráng miệng')
    ) {
      mappedImage =
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80';
    } else if (
      t.includes('lẩu') ||
      t.includes('mì') ||
      t.includes('phở') ||
      t.includes('súp') ||
      t.includes('bún')
    ) {
      mappedImage =
        'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80';
    } else {
      // type fallback
      if (dto.promoType === 'DISCOUNT') {
        mappedImage =
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80';
      } else if (dto.promoType === 'COMBO') {
        mappedImage =
          'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80';
      } else if (dto.promoType === 'GIFT') {
        mappedImage =
          'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80';
      }
    }

    return this.prisma.voucher.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        pointsCost: Number(dto.pointsCost),
        discountValue: dto.discountValue,
        minSpend: dto.minSpend,
        expiryDays: Number(dto.expiryDays),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        quantity: dto.quantity !== undefined ? Number(dto.quantity) : 100,
        usedCount: 0,
        image: dto.image || mappedImage,
        promoType: dto.promoType,
        restaurantId: rId,
        restaurantName: rName,
        applicableRestaurantIds: appRestIds,
      },
    });
  }

  async updateVoucher(
    userId: number,
    role: string,
    voucherId: string,
    dto: UpdateVoucherDto,
  ) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    // Role check
    if (role !== 'ADMIN') {
      if (voucher.restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: voucher.restaurantId },
          select: { ownerId: true },
        });
        if (!restaurant || restaurant.ownerId !== userId) {
          throw new ForbiddenException(
            'Bạn không có quyền chỉnh sửa voucher này',
          );
        }
      } else {
        throw new ForbiddenException(
          'Bạn không có quyền chỉnh sửa voucher hệ thống',
        );
      }
    }

    const updateData: any = {
      title: dto.title !== undefined ? dto.title : voucher.title,
      description:
        dto.description !== undefined ? dto.description : voucher.description,
      pointsCost:
        dto.pointsCost !== undefined
          ? Number(dto.pointsCost)
          : voucher.pointsCost,
      discountValue:
        dto.discountValue !== undefined
          ? dto.discountValue
          : voucher.discountValue,
      minSpend: dto.minSpend !== undefined ? dto.minSpend : voucher.minSpend,
      expiryDays:
        dto.expiryDays !== undefined
          ? Number(dto.expiryDays)
          : voucher.expiryDays,
      expiryDate:
        dto.expiryDate !== undefined
          ? dto.expiryDate
            ? new Date(dto.expiryDate)
            : null
          : voucher.expiryDate,
      quantity:
        dto.quantity !== undefined ? Number(dto.quantity) : voucher.quantity,
      image: dto.image !== undefined ? dto.image : voucher.image,
      promoType:
        dto.promoType !== undefined ? dto.promoType : voucher.promoType,
    };

    if (role === 'ADMIN') {
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
          updateData.restaurantName = 'Hệ thống FOOD AI';
        }
      }
      if (dto.applicableRestaurantIds !== undefined) {
        updateData.applicableRestaurantIds = dto.applicableRestaurantIds;
      }
    }

    return this.prisma.voucher.update({
      where: { id: voucherId },
      data: updateData,
    });
  }

  async deleteVoucher(userId: number, role: string, voucherId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    if (role !== 'ADMIN' && voucher.restaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: voucher.restaurantId },
        select: { ownerId: true },
      });
      if (!restaurant || restaurant.ownerId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa voucher này');
      }
    }

    await this.prisma.voucher.delete({
      where: { id: voucherId },
    });

    return { success: true };
  }

  async deleteUserVoucher(userId: number, userVoucherId: string) {
    const userVoucher = await this.prisma.userVoucher.findUnique({
      where: { id: userVoucherId },
      include: { voucher: true },
    });

    if (!userVoucher) {
      throw new NotFoundException('Không tìm thấy voucher trong kho');
    }

    if (userVoucher.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa voucher này');
    }

    // Check if it is actually expired
    const now = new Date();
    const isExpiredDate =
      userVoucher.voucher.expiryDate && now > userVoucher.voucher.expiryDate;

    // Check if it has expired based on expiryDays after redeemedAt
    const expiryLimit = new Date(
      userVoucher.redeemedAt.getTime() +
        userVoucher.voucher.expiryDays * 24 * 60 * 60 * 1000,
    );
    const isExpiredDays = now > expiryLimit;

    if (!isExpiredDate && !isExpiredDays && !userVoucher.isUsed) {
      throw new BadRequestException(
        'Voucher chưa hết hạn hoặc chưa sử dụng, không thể xóa khỏi ví',
      );
    }

    await this.prisma.userVoucher.delete({
      where: { id: userVoucherId },
    });

    return { success: true };
  }

  async redeemVoucher(userId: number, voucherId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        level: true,
        role: true,
        badgeTitle: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.points < voucher.pointsCost) {
      throw new BadRequestException(
        'Bạn không đủ điểm thưởng để đổi voucher này',
      );
    }

    if (voucher.usedCount >= voucher.quantity) {
      throw new BadRequestException('Voucher này đã hết lượt sử dụng');
    }

    if (voucher.restaurantId) {
      const isOwner = await this.prisma.restaurant.findFirst({
        where: { id: voucher.restaurantId, ownerId: userId },
      });
      if (isOwner) {
        throw new BadRequestException(
          'Bạn không thể tự đổi voucher của nhà hàng mình',
        );
      }
    }

    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const uniqueCode = `${voucher.code}-${randomSuffix}`;

    return await this.prisma.$transaction(async (tx) => {
      const gamificationResult = await this.gamificationQueue.addJob(
        userId,
        'REDEEM_VOUCHER',
        voucher.pointsCost,
      );

      await tx.voucher.update({
        where: { id: voucherId },
        data: { usedCount: { increment: 1 } },
      });

      await tx.userVoucher.create({
        data: {
          userId,
          voucherId,
          code: uniqueCode,
        },
      });

      return {
        code: uniqueCode,
        nextPoints: gamificationResult.points,
        level: gamificationResult.level,
        badgeTitle: gamificationResult.badgeTitle,
      };
    });
  }

  async generatePointCode(userId: number, dto: GeneratePointCodeDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        'Bạn không sở hữu cửa hàng nào để tạo mã tích điểm',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return this.prisma.pointCode.create({
      data: {
        code,
        points: Number(dto.points),
        restaurantId: restaurant.id,
        expiresAt,
      },
    });
  }

  async getPointCodesLogs(userId: number) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        'Bạn không sở hữu cửa hàng nào để xem log mã tích điểm',
      );
    }

    return this.prisma.pointCode.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async claimPointCode(userId: number, dto: ClaimPointCodeDto) {
    const pointCode = await this.prisma.pointCode.findUnique({
      where: { code: dto.code },
    });

    if (!pointCode) {
      throw new NotFoundException(
        'Mã tích điểm không hợp lệ hoặc không tồn tại',
      );
    }

    if (pointCode.usedById) {
      throw new BadRequestException('Mã tích điểm này đã được sử dụng');
    }

    if (new Date() > pointCode.expiresAt) {
      throw new BadRequestException(
        'Mã tích điểm này đã hết hạn sử dụng (quá 5 phút)',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const isOwner = await this.prisma.restaurant.findFirst({
      where: { id: pointCode.restaurantId, ownerId: userId },
    });
    if (isOwner) {
      throw new BadRequestException(
        'Bạn không thể sử dụng mã tích điểm của nhà hàng mình',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.pointCode.update({
        where: { id: pointCode.id },
        data: {
          usedById: userId,
          usedByName: user.name || user.email,
          usedAt: new Date(),
        },
      });

      const gamificationResult = await this.gamificationQueue.addJob(
        userId,
        'CLAIM_CODE',
        pointCode.points,
      );

      return {
        success: true,
        pointsAwarded: pointCode.points,
        nextPoints: gamificationResult.points,
        level: gamificationResult.level,
        badgeTitle: gamificationResult.badgeTitle,
      };
    });
  }

  async verifyVoucherCode(userId: number, code: string) {
    const uv = await this.prisma.userVoucher.findUnique({
      where: { code },
      include: {
        voucher: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!uv) {
      throw new NotFoundException('Mã voucher không tồn tại hoặc không hợp lệ');
    }

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        'Bạn không sở hữu cửa hàng nào để xác minh voucher',
      );
    }

    const isVoucherApplicable =
      uv.voucher.restaurantId === restaurant.id ||
      (uv.voucher.restaurantId === null &&
        (uv.voucher.applicableRestaurantIds.length === 0 ||
          uv.voucher.applicableRestaurantIds.includes(restaurant.id)));

    if (!isVoucherApplicable) {
      throw new ForbiddenException(
        'Voucher này không được áp dụng tại cửa hàng của bạn',
      );
    }

    if (uv.isUsed) {
      return {
        isValid: false,
        reason: 'Voucher này đã được sử dụng trước đó',
        details: {
          title: uv.voucher.title,
          discountValue: uv.voucher.discountValue,
          minSpend: uv.voucher.minSpend,
          customerName: uv.user.name || uv.user.email,
          redeemedAt: uv.redeemedAt,
          isUsed: uv.isUsed,
          usedAt: uv.usedAt,
        },
      };
    }

    const now = new Date();
    const isExpiredDate = uv.voucher.expiryDate && now > uv.voucher.expiryDate;
    const expiryLimit = new Date(
      uv.redeemedAt.getTime() + uv.voucher.expiryDays * 24 * 60 * 60 * 1000,
    );
    const isExpiredDays = now > expiryLimit;

    if (isExpiredDate || isExpiredDays) {
      return {
        isValid: false,
        reason: 'Voucher này đã hết hạn sử dụng',
        details: {
          title: uv.voucher.title,
          discountValue: uv.voucher.discountValue,
          minSpend: uv.voucher.minSpend,
          customerName: uv.user.name || uv.user.email,
          redeemedAt: uv.redeemedAt,
          isUsed: uv.isUsed,
          usedAt: uv.usedAt,
        },
      };
    }

    return {
      isValid: true,
      details: {
        title: uv.voucher.title,
        discountValue: uv.voucher.discountValue,
        minSpend: uv.voucher.minSpend,
        customerName: uv.user.name || uv.user.email,
        redeemedAt: uv.redeemedAt,
        isUsed: uv.isUsed,
      },
    };
  }

  async useVoucherCode(userId: number, code: string) {
    const verification = await this.verifyVoucherCode(userId, code);
    if (!verification.isValid) {
      throw new BadRequestException(
        verification.reason || 'Voucher không hợp lệ',
      );
    }

    const uv = await this.prisma.userVoucher.findUnique({
      where: { code },
    });

    if (!uv) {
      throw new NotFoundException('Mã voucher không tồn tại');
    }

    await this.prisma.userVoucher.update({
      where: { id: uv.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return { success: true };
  }
}
