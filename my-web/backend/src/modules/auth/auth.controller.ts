import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('profile/:id')
  async getProfile(
    @Param('id') id: string,
    @Query('requesterId') requesterId?: string,
  ) {
    const targetUserId = parseInt(id);
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        _count: {
          select: {
            follows: true,
            userFollowers: true,
            userFollowing: true,
          },
        },
        restaurants: {
          include: {
            _count: {
              select: { followers: true },
            },
          },
        },
      },
    });

    if (!user) return null;

    let isFollowing = false;
    if (requesterId) {
      const follow = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: parseInt(requesterId),
            followingId: targetUserId,
          },
        },
      });
      isFollowing = !!follow;
    }

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, isFollowing };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@GetUser('id') userId: number, @Body() body: any) {
    return this.authService.changePassword({ ...body, userId });
  }

  @Post('verify-profile-email')
  @UseGuards(JwtAuthGuard)
  async verifyProfileEmail(@GetUser('id') userId: number, @Body() body: any) {
    return this.authService.verifyProfileEmail({ ...body, userId });
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@GetUser('id') userId: number, @Body() body: any) {
    return this.authService.updateProfile(userId, body);
  }

  @Post('toggle-follow-user')
  @UseGuards(JwtAuthGuard)
  async toggleFollowUser(
    @GetUser('id') userId: number,
    @Body() body: { followingId: number },
  ) {
    const { followingId } = body;
    const followerId = userId;
    if (followerId === followingId)
      throw new Error('Không thể tự theo dõi chính mình');

    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });
      return { followed: false };
    } else {
      await this.prisma.userFollow.create({
        data: { followerId, followingId },
      });
      return { followed: true };
    }
  }

  @Post('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @GetUser('id') userId: number,
    @Body() body: { preferences: any },
  ) {
    const result = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        hasCompletedOnboarding: true,
        preferences: body.preferences,
      },
      create: {
        userId,
        hasCompletedOnboarding: true,
        preferences: body.preferences,
      },
    });

    this.aiService.updateUserEmbedding(userId);
    return result;
  }
}
