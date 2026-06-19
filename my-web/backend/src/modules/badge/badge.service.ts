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

  async createBadge(dto: {
    role: UserRole;
    title: string;
    points: number;
    minReviews?: number;
    minPostLikes?: number;
    minRatingAvg?: number;
    minRatingCount?: number;
    minFollowers?: number;
  }) {
    return this.prisma.badgeConfig.create({
      data: {
        role: dto.role,
        title: dto.title,
        points: Number(dto.points),
        minReviews:
          dto.minReviews !== undefined && dto.minReviews !== null
            ? Number(dto.minReviews)
            : null,
        minPostLikes:
          dto.minPostLikes !== undefined && dto.minPostLikes !== null
            ? Number(dto.minPostLikes)
            : null,
        minRatingAvg:
          dto.minRatingAvg !== undefined && dto.minRatingAvg !== null
            ? Number(dto.minRatingAvg)
            : null,
        minRatingCount:
          dto.minRatingCount !== undefined && dto.minRatingCount !== null
            ? Number(dto.minRatingCount)
            : null,
        minFollowers:
          dto.minFollowers !== undefined && dto.minFollowers !== null
            ? Number(dto.minFollowers)
            : null,
      },
    });
  }

  async deleteBadge(id: string) {
    return this.prisma.badgeConfig.delete({
      where: { id },
    });
  }

  async getGamificationConfig() {
    const config = await this.prisma.gamificationConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      return {
        id: 'singleton',
        pointsPerLevel: 1000,
        postReviewPoints: 50,
        commentPoints: 10,
        likePoints: 5,
        deductionMultiplier: 1.0,
      };
    }
    return config;
  }
}
