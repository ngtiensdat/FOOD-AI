// Mục đích: Cung cấp dịch vụ quản lý thông tin hồ sơ và các quan hệ xã hội của người dùng (lấy hồ sơ, cập nhật thông tin cá nhân/sở thích, toggle follow).
// File quan hệ: Gọi UserRepository, PrismaService và được gọi bởi UserController, AuthService.
// Chức năng đặc biệt: Hỗ trợ quyền riêng tư (ẩn/hiện danh sách followers/following qua preferences), gộp dữ liệu sở thích (preferences JSON), và ngăn chặn tự theo dõi chính mình.
// Kiến thức/Design Pattern: Service Layer Pattern, SOLID (Single Responsibility, Dependency Inversion), Privacy Controls, Ownership Verification.
// Các biến, hàm đặc biệt: getProfile(), updateProfile(), getFollowers(), getFollowing(), toggleFollow().

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private prisma: PrismaService,
  ) {}

  async getProfile(targetId: number, requesterId?: number) {
    const user = await this.userRepository.findById(targetId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    let isFollowing = false;
    if (requesterId) {
      const follow = await this.userRepository.findWithFollow(
        requesterId,
        targetId,
      );
      isFollowing = !!follow;
    }

    const {
      password: _password,
      refreshToken: _refreshToken,
      ...userWithoutSensitiveData
    } = user;
    return { ...userWithoutSensitiveData, isFollowing };
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    const profileUpdate: Prisma.UserProfileUpdateInput = {
      fullName: data.name || data.fullName,
      phone: data.phone,
      avatar: data.avatar,
      coverImage: data.coverImage,
      bio: data.bio,
      address: data.address,
      workAt: data.workAt,
    };

    if (data.preferences !== undefined) {
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
        select: { preferences: true },
      });
      const currentPrefs =
        (existingProfile?.preferences as Prisma.JsonObject) || {};
      profileUpdate.preferences = {
        ...currentPrefs,
        ...data.preferences,
      } as Prisma.InputJsonValue;
    }

    await this.userRepository.upsertProfile(userId, profileUpdate);

    if (data.name) {
      await this.userRepository.update(userId, { name: data.name });
    }

    return { message: MESSAGES.USER.UPDATE_SUCCESS };
  }

  async getFollowers(targetId: number, requesterId?: number) {
    const user = await this.userRepository.findById(targetId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    if (user.profile?.preferences) {
      const preferences = user.profile.preferences as {
        showFollowList?: boolean;
      } | null;
      if (preferences?.showFollowList === false && requesterId !== targetId) {
        throw new ForbiddenException(MESSAGES.USER.FOLLOWERS_HIDDEN);
      }
    }

    const follows = await this.prisma.userFollow.findMany({
      where: { followingId: targetId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: {
              select: {
                avatar: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    return follows.map((f) => f.follower);
  }

  async getFollowing(targetId: number, requesterId?: number) {
    const user = await this.userRepository.findById(targetId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    if (user.profile?.preferences) {
      const preferences = user.profile.preferences as {
        showFollowList?: boolean;
      } | null;
      if (preferences?.showFollowList === false && requesterId !== targetId) {
        throw new ForbiddenException(MESSAGES.USER.FOLLOWING_HIDDEN);
      }
    }

    const userFollowings = await this.prisma.userFollow.findMany({
      where: { followerId: targetId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: {
              select: {
                avatar: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    const restaurantFollowings = await this.prisma.follow.findMany({
      where: { userId: targetId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                coverImage: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    return {
      users: userFollowings.map((f) => f.following),
      restaurants: restaurantFollowings.map((f) => f.restaurant),
    };
  }

  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new ForbiddenException(MESSAGES.USER.CANNOT_FOLLOW_SELF);
    }

    const targetUser = await this.userRepository.findById(followingId);
    if (!targetUser) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    const existingFollow = await this.userRepository.findWithFollow(
      followerId,
      followingId,
    );

    if (existingFollow) {
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { isFollowing: false };
    } else {
      await this.prisma.userFollow.create({
        data: {
          followerId,
          followingId,
        },
      });
      return { isFollowing: true };
    }
  }
}
