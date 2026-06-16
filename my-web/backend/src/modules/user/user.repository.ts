// Mục đích: Cung cấp các thao tác truy vấn cơ sở dữ liệu trực tiếp liên quan đến bảng người dùng (User), hồ sơ cá nhân (UserProfile) và quan hệ theo dõi (UserFollow) qua Prisma.
// File quan hệ: Gọi PrismaService, sử dụng các kiểu dữ liệu từ @prisma/client và được gọi bởi UserRepository, UserService, AuthService.
// Chức năng đặc biệt: CRUD cơ bản người dùng và hồ sơ cá nhân (upsertProfile), tìm kiếm theo vai trò, quản trị phê duyệt merchant (findPendingUsers), và hỗ trợ các thao tác thiết lập follow/unfollow người dùng.
// Kiến thức/Design Pattern: Repository Pattern (tách biệt logic truy xuất dữ liệu), Dependency Injection.
// Các biến, hàm đặc biệt: findByEmail(), findById(), create(), update(), updateRefreshToken(), findWithFollow(), follow(), unfollow(), upsertProfile(), findPendingUsers(), updateRestaurantsStatus(), findAllUsers(), hardDeleteUser().

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        restaurants: {
          include: {
            profile: true,
            _count: {
              select: { followers: true },
            },
          },
        },
        _count: {
          select: {
            follows: true,
            userFollowers: true,
            userFollowing: true,
            posts: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      include: {
        profile: true,
        restaurants: true,
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  async updateRefreshToken(id: number, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async findWithFollow(followerId: number, followingId: number) {
    return this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  }

  async follow(followerId: number, followingId: number) {
    return this.prisma.userFollow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: number, followingId: number) {
    return this.prisma.userFollow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  }

  async upsertProfile(userId: number, data: Prisma.UserProfileUpdateInput) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        ...(data as Prisma.UserProfileCreateWithoutUserInput),
        user: { connect: { id: userId } },
      },
    });
  }

  async findPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.RESTAURANT,
        status: UserStatus.PENDING,
      },
      select: {
        id: true,
        name: true,
        email: true,
        legalDocuments: true,
        createdAt: true,
      },
    });
  }

  async updateRestaurantsStatus(ownerId: number, isActive: boolean) {
    return this.prisma.restaurant.updateMany({
      where: { ownerId },
      data: { isActive },
    });
  }

  async findAllUsers(role?: Prisma.UserWhereInput['role']) {
    return this.prisma.user.findMany({
      where: {
        role,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hardDeleteUser(userId: number) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
