import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('badges')
export class BadgeController {
  constructor(private badgeService: BadgeService) {}

  @Get()
  async getAllBadges() {
    return this.badgeService.getAllBadges();
  }

  @Get('rules')
  async getRules() {
    return this.badgeService.getGamificationConfig();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createBadge(
    @Body()
    dto: {
      role: UserRole;
      title: string;
      points: number;
      minReviews?: number;
      minPostLikes?: number;
      minRatingAvg?: number;
      minRatingCount?: number;
      minFollowers?: number;
    },
  ) {
    return this.badgeService.createBadge(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteBadge(@Param('id') id: string) {
    return this.badgeService.deleteBadge(id);
  }
}
