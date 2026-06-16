import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  PostType,
  PostStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';
import { MESSAGES } from '../../common/constants/messages.constant';
import { LIMITS } from '../../common/constants/limits.constant';
import { POINTS_PER_LEVEL } from '../../common/constants/badge.constant';
import { CacheService } from '../../common/services/cache.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { GamificationQueueService } from '../badge/gamification-queue.service';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private readonly notificationGateway: NotificationGateway,
    private readonly gamificationQueue: GamificationQueueService,
  ) {}

  async awardPoints(
    userId: number,
    pointsAmount: number,
    prismaTx?: Prisma.TransactionClient,
  ) {
    if (prismaTx) {
      const user = await prismaTx.user.findUnique({
        where: { id: userId },
        select: { points: true, level: true },
      });
      if (!user) return;
      const nextPoints = Math.max(0, user.points + pointsAmount);
      const nextLevel = Math.floor(nextPoints / POINTS_PER_LEVEL) + 1;
      await prismaTx.user.update({
        where: { id: userId },
        data: {
          points: nextPoints,
          level: nextLevel,
        },
      });
    } else {
      await this.gamificationQueue.addJob(
        userId,
        pointsAmount > 0 ? 'LIKE' : 'UNDO_LIKE',
      );
    }
  }

  async getAllPosts(
    viewerId?: number,
    authorId?: number,
    page: number = 1,
    pageSize: number = LIMITS.POSTS_DEFAULT_PAGE_SIZE,
  ) {
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      status: PostStatus.APPROVED,
    };

    if (authorId) {
      where.authorId = authorId;
    }

    const cacheKey = `posts:list:${authorId || 'all'}:${page}:${pageSize}`;
    const cached = await this.cacheService.wrap(
      cacheKey,
      async () => {
        const posts = await this.prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
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
            savedPosts: true,
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

        const total = await this.prisma.post.count({ where });
        return { posts, total };
      },
      120, // 2 minutes TTL
    );

    // Format posts to match frontend's expected properties, checking likes dynamically
    const formattedPosts = cached.posts.map((post) => {
      const isLiked = viewerId
        ? post.likes.some((like) => like.userId === viewerId)
        : false;

      const isSaved = viewerId
        ? post.savedPosts?.some((s: any) => s.userId === viewerId) || false
        : false;

      const parentComments = post.comments
        .filter((c) => !c.parentId)
        .map((c) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user.name,
          userAvatar: c.user.profile?.avatar || '',
          content: c.content,
          createdAt: new Date(c.createdAt).toISOString(),
          replies: c.replies.map((r) => ({
            id: r.id,
            userId: r.userId,
            userName: r.user.name,
            userAvatar: r.user.profile?.avatar || '',
            content: r.content,
            createdAt: new Date(r.createdAt).toISOString(),
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
        isSaved,
        likedByUsers: post.likes.map((l) => ({ id: l.userId })),
        comments: parentComments,
        createdAt: new Date(post.createdAt).toISOString(),
      };
    });

    return {
      data: formattedPosts,
      meta: {
        total: cached.total,
        page,
        pageSize,
      },
    };
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
    const sanitizedContent = dto.content
      ? DOMPurify.sanitize(dto.content)
      : dto.content;
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        title: dto.title,
        content: sanitizedContent,
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

    // Queue points update
    await this.gamificationQueue.addJob(userId, 'POST_REVIEW');
    await this.cacheService.invalidatePattern('posts:*');

    return post;
  }

  async deletePost(userId: number, role: UserRole, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (post.authorId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    // Deduct points
    await this.gamificationQueue.addJob(post.authorId, 'UNDO_POST_REVIEW');

    await this.cacheService.invalidatePattern('posts:*');

    return { success: true };
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
      // Deduct points
      await this.gamificationQueue.addJob(userId, 'UNDO_LIKE');
      await this.cacheService.invalidatePattern('posts:*');
      return { isLiked: false };
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      // Gửi thông báo real-time & lưu DB cho tác giả bài viết
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
      });
      if (post && post.authorId !== userId) {
        const liker = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        const likerName = liker?.name || 'Ai đó';
        await this.notificationGateway.sendNotificationToUser(post.authorId, {
          type: NotificationType.LIKE,
          title: 'Lượt thích mới',
          content: `${likerName} đã thích bài viết "${post.title || 'không có tiêu đề'}" của bạn.`,
          senderId: userId,
          postId: postId,
        });
      }

      // Queue points update
      await this.gamificationQueue.addJob(userId, 'LIKE');
      await this.cacheService.invalidatePattern('posts:*');
      return { isLiked: true };
    }
  }

  async createComment(
    userId: number,
    postId: number,
    dto: { content: string; parentId?: number },
  ) {
    const sanitizedContent = dto.content
      ? DOMPurify.sanitize(dto.content)
      : dto.content;
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: sanitizedContent,
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

    // Gửi thông báo real-time & lưu DB cho tác giả bài viết
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true },
    });
    if (post && post.authorId !== userId) {
      const commenterName = comment.user.name || 'Ai đó';
      await this.notificationGateway.sendNotificationToUser(post.authorId, {
        type: NotificationType.COMMENT,
        title: dto.parentId ? 'Phản hồi bình luận mới' : 'Bình luận mới',
        content: `${commenterName} đã bình luận bài viết "${post.title || 'không có tiêu đề'}" của bạn.`,
        senderId: userId,
        postId: postId,
      });
    }

    // Queue points update
    if (dto.parentId) {
      await this.gamificationQueue.addJob(userId, 'REPLY');
    } else {
      await this.gamificationQueue.addJob(userId, 'COMMENT');
    }
    await this.cacheService.invalidatePattern('posts:*');

    return {
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      userAvatar: comment.user.profile?.avatar || '',
      content: comment.content,
      createdAt: new Date(comment.createdAt).toISOString(),
      replies: [],
    };
  }

  async deleteComment(userId: number, role: UserRole, commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new NotFoundException(MESSAGES.SOCIAL.COMMENT_NOT_FOUND);
    }

    // Check ownership: commenter or post author or admin
    if (
      comment.userId !== userId &&
      comment.post.authorId !== userId &&
      role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        MESSAGES.SOCIAL.NO_DELETE_COMMENT_PERMISSION,
      );
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Deduct points
    if (comment.parentId) {
      await this.gamificationQueue.addJob(comment.userId, 'UNDO_REPLY');
    } else {
      await this.gamificationQueue.addJob(comment.userId, 'UNDO_COMMENT');
    }

    await this.cacheService.invalidatePattern('posts:*');

    return { success: true };
  }

  async toggleSavePost(userId: number, postId: number) {
    const existing = await this.prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedPost.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return { isSaved: false };
    } else {
      await this.prisma.savedPost.create({
        data: {
          userId,
          postId,
        },
      });
      return { isSaved: true };
    }
  }

  async getSavedPosts(userId: number) {
    const saved = await this.prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
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
            savedPosts: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => {
      const post = s.post;
      const isLiked = post.likes.some((like) => like.userId === userId);

      const parentComments = post.comments
        .filter((c) => !c.parentId)
        .map((c) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user.name,
          userAvatar: c.user.profile?.avatar || '',
          content: c.content,
          createdAt: new Date(c.createdAt).toISOString(),
          replies: c.replies.map((r) => ({
            id: r.id,
            userId: r.userId,
            userName: r.user.name,
            userAvatar: r.user.profile?.avatar || '',
            content: r.content,
            createdAt: new Date(r.createdAt).toISOString(),
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
        isSaved: true,
        likedByUsers: post.likes.map((l) => ({ id: l.userId })),
        comments: parentComments,
        createdAt: new Date(post.createdAt).toISOString(),
      };
    });
  }
}
