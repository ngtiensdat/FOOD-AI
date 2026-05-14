import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

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
}
