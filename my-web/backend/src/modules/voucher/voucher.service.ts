import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VoucherService {
  constructor(private prisma: PrismaService) {}

  async getAllVouchers() {
    return this.prisma.voucher.findMany({
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
      code: r.code,
      title: r.voucher.title,
      redeemedAt: r.redeemedAt.toISOString(),
    }));
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
      select: { points: true, level: true, role: true, badgeTitle: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.points < voucher.pointsCost) {
      throw new BadRequestException(
        'Bạn không đủ điểm thưởng để đổi voucher này',
      );
    }

    const nextPoints = user.points - voucher.pointsCost;

    // Recalculate level and badge title based on new points
    const nextLevel = Math.max(1, Math.floor(nextPoints / 1000) + 1);

    const badges = await this.prisma.badgeConfig.findMany({
      where: { role: user.role },
    });

    let nextBadge = user.badgeTitle;
    if (badges.length > 0) {
      const sorted = badges.sort((a, b) => b.points - a.points);
      const matched = sorted.find((b) => nextPoints >= b.points);
      nextBadge = matched ? matched.title : null;
    } else {
      const defaults = [
        { role: 'CUSTOMER', title: 'Thực Khách Năng Động', points: 300 },
        { role: 'CUSTOMER', title: 'Chuyên Gia Ẩm Thực', points: 1000 },
        { role: 'CUSTOMER', title: 'Thánh Review Cao Cấp', points: 3000 },
        { role: 'RESTAURANT', title: 'Đối Tác Tiềm Năng', points: 500 },
        { role: 'RESTAURANT', title: 'Đối Tác Uy Tín', points: 2000 },
        { role: 'RESTAURANT', title: 'Thương Hiệu Xuất Sắc', points: 5000 },
      ];
      const sorted = defaults
        .filter((b) => b.role === user.role)
        .sort((a, b) => b.points - a.points);
      const matched = sorted.find((b) => nextPoints >= b.points);
      nextBadge = matched ? matched.title : null;
    }

    // Generate random 4-char suffix
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const uniqueCode = `${voucher.code}-${randomSuffix}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct user points
      await tx.user.update({
        where: { id: userId },
        data: {
          points: nextPoints,
          level: nextLevel,
          badgeTitle: nextBadge,
        },
      });

      // 2. Create redeemed log
      const userVoucher = await tx.userVoucher.create({
        data: {
          userId,
          voucherId,
          code: uniqueCode,
        },
      });

      return {
        code: uniqueCode,
        nextPoints,
        level: nextLevel,
        badgeTitle: nextBadge,
      };
    });
  }
}
