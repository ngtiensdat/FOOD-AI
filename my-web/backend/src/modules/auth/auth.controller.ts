import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
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
  async getProfile(@Param('id') id: string, @Query('requesterId') requesterId?: string) {
    const targetUserId = parseInt(id);
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { 
        profile: true,
        _count: {
          select: { 
            follows: true, 
            userFollowers: true,
            userFollowing: true
          }
        },
        restaurants: {
          include: {
            _count: {
              select: { followers: true }
            }
          }
        }
      }
    });

    if (!user) return null;

    let isFollowing = false;
    if (requesterId) {
      const follow = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: parseInt(requesterId),
            followingId: targetUserId
          }
        }
      });
      isFollowing = !!follow;
    }

    return { ...user, isFollowing };
  }

  @Post('change-password')
  async changePassword(@Body() body: any) {
    return this.authService.changePassword(body);
  }

  @Post('verify-profile-email')
  async verifyProfileEmail(@Body() body: any) {
    return this.authService.verifyProfileEmail(body);
  }

  @Post('update-profile')
  async updateProfile(@Body() body: any) {
    const { userId, ...data } = body;
    return this.authService.updateProfile(parseInt(userId), data);
  }

  @Post('toggle-follow-user')
  async toggleFollowUser(@Body() body: { followerId: number, followingId: number }) {
    const { followerId, followingId } = body;
    if (followerId === followingId) throw new Error('Không thể tự theo dõi chính mình');

    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });

    if (existing) {
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: { followerId, followingId }
        }
      });
      return { followed: false };
    } else {
      await this.prisma.userFollow.create({
        data: { followerId, followingId }
      });
      return { followed: true };
    }
  }

  @Post('complete-onboarding')
  async completeOnboarding(@Body() body: { userId: number, preferences: any }) {
    const { userId, preferences } = body;
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        hasCompletedOnboarding: true,
        preferences: preferences
      }
    });
  }
}
