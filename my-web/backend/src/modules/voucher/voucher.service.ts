import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GamificationQueueService } from '../badge/gamification-queue.service';

@Injectable()
export class VoucherService {
  constructor(
    private prisma: PrismaService,
    private gamificationQueue: GamificationQueueService,
  ) {}

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

    // Generate random 4-char suffix
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const uniqueCode = `${voucher.code}-${randomSuffix}`;

    // Call gamificationQueue to deduct points, update level/badge
    const gamificationResult = await this.gamificationQueue.addJob(
      userId,
      'REDEEM_VOUCHER',
      voucher.pointsCost,
    );

    // Create redeemed log
    await this.prisma.userVoucher.create({
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
  }
}
