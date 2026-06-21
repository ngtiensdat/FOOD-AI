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
import { Prisma, UserRole } from '@prisma/client';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { MESSAGES } from '../../common/constants/messages.constant';
import { MediaService } from '../media/media.service';

function extractPublicId(url: string): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const pathParts = parts[1].split('/');
    if (pathParts[0].match(/^v\d+$/)) pathParts.shift();
    const remainingPath = pathParts.join('/');
    const dotIndex = remainingPath.lastIndexOf('.');
    return dotIndex !== -1
      ? remainingPath.substring(0, dotIndex)
      : remainingPath;
  } catch {
    return null;
  }
}

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private prisma: PrismaService,
    private mediaService: MediaService,
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

  /**
   * Cập nhật thông tin hồ sơ cá nhân của người dùng bằng Prisma transaction.
   * Đồng thời thực hiện đồng bộ ngược Logo và Ảnh bìa của cửa hàng nếu người dùng sở hữu vai trò MERCHANT (RESTAURANT)
   * và các cờ đồng bộ tương ứng được tích chọn.
   */
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

    const oldProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { avatar: true, coverImage: true },
    });
    const oldAvatar = oldProfile?.avatar;
    const oldCoverImage = oldProfile?.coverImage;

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

    await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật hồ sơ cá nhân (UserProfile)
      await tx.userProfile.upsert({
        where: { userId },
        update: profileUpdate,
        create: {
          ...(profileUpdate as Prisma.UserProfileCreateWithoutUserInput),
          user: { connect: { id: userId } },
        },
      });

      // 2. Cập nhật tên của tài khoản người dùng chính (User) nếu có thay đổi
      if (data.name) {
        await tx.user.update({
          where: { id: userId },
          data: { name: data.name },
        });
      }

      // 3. Đồng bộ ngược sang RestaurantProfile nếu vai trò là RESTAURANT
      if (user.role === UserRole.RESTAURANT) {
        const restaurantUpdate: Prisma.RestaurantProfileUpdateInput = {};
        if (data.syncWithRestaurantLogo && data.avatar) {
          restaurantUpdate.logo = data.avatar;
        }
        if (data.syncWithRestaurantCover && data.coverImage) {
          restaurantUpdate.coverImage = data.coverImage;
        }

        if (Object.keys(restaurantUpdate).length > 0) {
          // Lấy tất cả các cửa hàng thuộc sở hữu của người dùng này
          const userRestaurants = await tx.restaurant.findMany({
            where: { ownerId: userId },
            select: { id: true },
          });

          for (const restaurant of userRestaurants) {
            await tx.restaurantProfile.upsert({
              where: { restaurantId: restaurant.id },
              update: restaurantUpdate,
              create: {
                logo: restaurantUpdate.logo as string | undefined,
                coverImage: restaurantUpdate.coverImage as string | undefined,
                restaurant: { connect: { id: restaurant.id } },
              },
            });
          }
        }
      }
    });

    // 4. Xóa ảnh cũ trên Cloudinary để tiết kiệm dung lượng
    if (data.avatar && oldAvatar && data.avatar !== oldAvatar) {
      const publicId = extractPublicId(oldAvatar);
      if (publicId) {
        this.mediaService
          .deleteImage(publicId)
          .catch((err) => console.error('Lỗi xóa avatar cũ:', err));
      }
    }

    if (data.coverImage && oldCoverImage && data.coverImage !== oldCoverImage) {
      const publicId = extractPublicId(oldCoverImage);
      if (publicId) {
        this.mediaService
          .deleteImage(publicId)
          .catch((err) => console.error('Lỗi xóa cover cũ:', err));
      }
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
            address: true,
            mapUrl: true,
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

  async getLeaderboard() {
    return this.prisma.user.findMany({
      where: {
        role: { not: UserRole.ADMIN },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        role: true,
        points: true,
        level: true,
        badgeTitle: true,
        profile: {
          select: {
            avatar: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 10,
    });
  }
}
