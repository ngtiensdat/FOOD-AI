import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateGamificationConfigDto } from './dto/update-gamification-config.dto';

@Controller('admin/gamification-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class GamificationConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getConfig() {
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

  @Put()
  async updateConfig(@Body() dto: UpdateGamificationConfigDto) {
    return this.prisma.gamificationConfig.upsert({
      where: { id: 'singleton' },
      update: {
        pointsPerLevel:
          dto.pointsPerLevel !== undefined
            ? Number(dto.pointsPerLevel)
            : undefined,
        postReviewPoints:
          dto.postReviewPoints !== undefined
            ? Number(dto.postReviewPoints)
            : undefined,
        commentPoints:
          dto.commentPoints !== undefined
            ? Number(dto.commentPoints)
            : undefined,
        likePoints:
          dto.likePoints !== undefined ? Number(dto.likePoints) : undefined,
        deductionMultiplier:
          dto.deductionMultiplier !== undefined
            ? Number(dto.deductionMultiplier)
            : undefined,
      },
      create: {
        id: 'singleton',
        pointsPerLevel:
          dto.pointsPerLevel !== undefined ? Number(dto.pointsPerLevel) : 1000,
        postReviewPoints:
          dto.postReviewPoints !== undefined
            ? Number(dto.postReviewPoints)
            : 50,
        commentPoints:
          dto.commentPoints !== undefined ? Number(dto.commentPoints) : 10,
        likePoints: dto.likePoints !== undefined ? Number(dto.likePoints) : 5,
        deductionMultiplier:
          dto.deductionMultiplier !== undefined
            ? Number(dto.deductionMultiplier)
            : 1.0,
      },
    });
  }
}
