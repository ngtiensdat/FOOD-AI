import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PostType, PostStatus } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(
    userId: number,
    pointsAmount: number,
    prismaTx?: Prisma.TransactionClient,
  ) {
    const prisma = prismaTx || this.prisma;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, level: true, role: true, badgeTitle: true },
    });
    if (!user) return;
    const nextPoints = user.points + pointsAmount;

    // Level calculation
    const nextLevel = Math.floor(nextPoints / 1000) + 1;

    // Badge calculation
    const badges = await prisma.badgeConfig.findMany({
      where: { role: user.role },
    });

    let nextBadge = user.badgeTitle;
    if (badges.length > 0) {
      const sorted = badges.sort((a, b) => b.points - a.points);
      const matched = sorted.find((b) => nextPoints >= b.points);
      nextBadge = matched ? matched.title : null;
    } else {
      // Fallback defaults
      const defaults = [
        { role: 'CUSTOMER', title: 'Thực Khách Năng Động', points: 300 },
        { role: 'CUSTOMER', title: 'Chuyên Gia Ẩm Thực', points: 1000 },
        { role: 'CUSTOMER', title: 'Thánh Review Cao Cấp', points: 3000 },
        { role: 'RESTAURANT', title: 'Đối Tác Tiềm Năng', points: 500 },
        { role: 'RESTAURANT', title: 'Đối Tác Uy Tín', points: 2000 },
        { role: 'RESTAURANT', title: 'Thương Hiệu Xuất Sắc', points: 5000 },
      ];
      const sorted = defaults
        .filter((b) => b.role === user.role)
        .sort((a, b) => b.points - a.points);
      const matched = sorted.find((b) => nextPoints >= b.points);
      nextBadge = matched ? matched.title : null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        points: nextPoints,
        level: nextLevel,
        badgeTitle: nextBadge,
      },
    });
  }

  async getAllPosts(viewerId?: number, authorId?: number) {
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      status: PostStatus.APPROVED,
    };

    if (authorId) {
      where.authorId = authorId;
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            level: true,
            badgeTitle: true,
            profile: { select: { avatar: true } },
          },
        },
        food: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true } },
              },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile: { select: { avatar: true } },
                  },
                },
              },
            },
          },
        },
        sharedFrom: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true } },
              },
            },
          },
        },
      },
    });

    // Format posts to match frontend's expected properties
    return posts.map((post) => {
      const isLiked = viewerId
        ? post.likes.some((like) => like.userId === viewerId)
        : false;

      // Parse comment hierarchy (separate parent comments and replies if not already nested)
      // Note: prisma include replies is already recursive for one level which is enough for comment replies
      const parentComments = post.comments
        .filter((c) => !c.parentId)
        .map((c) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user.name,
          userAvatar: c.user.profile?.avatar || '',
          content: c.content,
          createdAt: c.createdAt.toISOString(),
          replies: c.replies.map((r) => ({
            id: r.id,
            userId: r.userId,
            userName: r.user.name,
            userAvatar: r.user.profile?.avatar || '',
            content: r.content,
            createdAt: r.createdAt.toISOString(),
          })),
        }));

      return {
        id: post.id,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.profile?.avatar || '',
          level: post.author.level,
          badgeTitle: post.author.badgeTitle,
        },
        restaurantId: post.restaurantId,
        restaurantName: post.restaurant?.name || null,
        foodId: post.foodId,
        foodName: post.food?.name || null,
        title: post.title,
        content: post.content,
        image: post.image,
        rating: post.rating,
        postType: post.postType,
        isShared: post.isShared,
        sharedFrom: post.sharedFrom
          ? {
              id: post.sharedFrom.id,
              name: post.sharedFrom.author.name,
              avatar: post.sharedFrom.author.profile?.avatar || '',
              title: post.sharedFrom.title,
              content: post.sharedFrom.content,
              image: post.sharedFrom.image,
            }
          : null,
        likesCount: post.likes.length,
        commentsCount:
          parentComments.length +
          parentComments.reduce(
            (acc, curr) => acc + (curr.replies?.length || 0),
            0,
          ),
        isLiked,
        likedByUsers: post.likes.map((l) => ({ id: l.userId })), // Simplified for frontend checklist
        comments: parentComments,
        createdAt: post.createdAt.toISOString(),
      };
    });
  }

  async createPost(
    userId: number,
    dto: {
      title?: string;
      content?: string;
      image?: string;
      rating?: number;
      postType?: PostType;
      restaurantId?: number;
      foodId?: number;
      isShared?: boolean;
      sharedFromId?: number;
    },
  ) {
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        title: dto.title,
        content: dto.content,
        image: dto.image,
        rating: dto.rating ? Number(dto.rating) : null,
        postType: dto.postType || PostType.NORMAL,
        restaurantId: dto.restaurantId ? Number(dto.restaurantId) : null,
        foodId: dto.foodId ? Number(dto.foodId) : null,
        isShared: !!dto.isShared,
        sharedFromId: dto.sharedFromId ? Number(dto.sharedFromId) : null,
        status: PostStatus.APPROVED,
      },
    });

    // Award 50 points
    await this.awardPoints(userId, 50);

    return post;
  }

  async toggleLike(userId: number, postId: number) {
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return { isLiked: false };
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      // Award 5 points
      await this.awardPoints(userId, 5);
      return { isLiked: true };
    }
  }

  async createComment(
    userId: number,
    postId: number,
    dto: { content: string; parentId?: number },
  ) {
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: dto.content,
        parentId: dto.parentId ? Number(dto.parentId) : null,
      },
      include: {
        user: {
          select: {
            name: true,
            profile: { select: { avatar: true } },
          },
        },
      },
    });

    // Award 10 points for parent comment, 5 points for reply
    const points = dto.parentId ? 5 : 10;
    await this.awardPoints(userId, points);

    return {
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      userAvatar: comment.user.profile?.avatar || '',
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      replies: [],
    };
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    // Check ownership: commenter or post author
    if (comment.userId !== userId && comment.post.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }
}
