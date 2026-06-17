import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class BadgeService {
  constructor(private prisma: PrismaService) {}

  async getAllBadges() {
    return this.prisma.badgeConfig.findMany({
      orderBy: { points: 'asc' },
    });
  }

  async createBadge(dto: { role: UserRole; title: string; points: number }) {
    return this.prisma.badgeConfig.create({
      data: {
        role: dto.role,
        title: dto.title,
        points: Number(dto.points),
      },
    });
  }

  async deleteBadge(id: string) {
    return this.prisma.badgeConfig.delete({
      where: { id },
    });
  }
}
