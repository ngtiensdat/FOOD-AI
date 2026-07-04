import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';
import {
  NotificationType,
  UserRole,
  PostType,
  PostStatus,
} from '@prisma/client';
import {
  DEFAULT_BADGE_CONFIGS,
  DEFAULT_LEVEL_UP_POINTS_REWARD,
  DEFAULT_POST_REVIEW_POINTS,
  DEFAULT_COMMENT_POINTS,
  DEFAULT_LIKE_POINTS,
  DEFAULT_DEDUCTION_MULTIPLIER,
  POINTS_PER_LEVEL,
  DEFAULT_STARTING_LEVEL,
  MIN_POINTS_OR_XP,
} from '../../common/constants/badge.constant';
import { MESSAGES } from '../../common/constants/messages.constant';

export interface GamificationResult {
  points: number;
  level: number;
  badgeTitle: string | null;
  pointsChanged: number;
}

export interface GamificationJob {
  userId: number;
  action:
    | 'POST_REVIEW'
    | 'COMMENT'
    | 'REPLY'
    | 'LIKE'
    | 'UNDO_POST_REVIEW'
    | 'UNDO_COMMENT'
    | 'UNDO_REPLY'
    | 'UNDO_LIKE'
    | 'REDEEM_VOUCHER'
    | 'CLAIM_CODE';
  voucherPointsCost?: number;
  resolve: (value: GamificationResult) => void;
  reject: (reason: unknown) => void;
}

@Injectable()
export class GamificationQueueService implements OnModuleInit {
  private readonly logger = new Logger(GamificationQueueService.name);
  private readonly queue$ = new Subject<GamificationJob>();

  private static readonly SWEEP_INITIAL_DELAY_MS = 5000;
  private static readonly SWEEP_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  onModuleInit() {
    // Process points updates sequentially to avoid DB locking and race conditions
    this.queue$
      .pipe(
        concatMap(async (job) => {
          try {
            const result = await this.processJob(job);
            job.resolve(result);
          } catch (error) {
            this.logger.error(
              `Error processing gamification job: ${error.message}`,
              error.stack,
            );
            job.reject(error);
          }
        }),
      )
      .subscribe();

    // Only run startup sweep in production to avoid severe CPU/DB load during local dev restarts
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        void this.runFullSweep();
      }, GamificationQueueService.SWEEP_INITIAL_DELAY_MS);
    } else {
      this.logger.log(
        'Development mode: Skipping badge gamification startup sweep.',
      );
    }

    setInterval(() => {
      void this.runFullSweep();
    }, GamificationQueueService.SWEEP_INTERVAL_MS);
  }

  async runFullSweep() {
    this.logger.log('Starting gamification full sweep for badges...');
    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          role: true,
          badgeTitle: true,
          points: true,
          xp: true,
        },
      });

      for (const user of users) {
        await this.prisma.$transaction(async (tx) => {
          const badges = await tx.badgeConfig.findMany({
            where: { role: user.role },
          });

          let nextBadge: string | null = user.badgeTitle;
          if (badges.length > 0) {
            const sorted = badges.sort((a, b) => b.points - a.points);

            // Fetch user stats
            const [reviewsCount, postLikesCount, followersCount, restaurant] =
              await Promise.all([
                tx.post.count({
                  where: {
                    authorId: user.id,
                    postType: PostType.REVIEW,
                    status: PostStatus.APPROVED,
                    deletedAt: null,
                  },
                }),
                tx.like.count({
                  where: { post: { authorId: user.id } },
                }),
                user.role === UserRole.CUSTOMER
                  ? tx.userFollow.count({ where: { followingId: user.id } })
                  : tx.follow.count({
                      where: { restaurant: { ownerId: user.id } },
                    }),
                user.role === UserRole.RESTAURANT
                  ? tx.restaurant.findFirst({
                      where: { ownerId: user.id },
                      select: { ratingAvg: true, ratingCount: true },
                    })
                  : null,
              ]);

            const ratingAvg = restaurant?.ratingAvg ?? 0;
            const ratingCount = restaurant?.ratingCount ?? 0;

            const matched = sorted.find((b) => {
              if (user.xp < b.points) return false;
              if (b.minReviews !== null && reviewsCount < b.minReviews)
                return false;
              if (b.minPostLikes !== null && postLikesCount < b.minPostLikes)
                return false;
              if (b.minRatingAvg !== null && ratingAvg < b.minRatingAvg)
                return false;
              if (b.minRatingCount !== null && ratingCount < b.minRatingCount)
                return false;
              if (b.minFollowers !== null && followersCount < b.minFollowers)
                return false;
              return true;
            });

            nextBadge = matched ? matched.title : null;
          } else {
            const sorted = DEFAULT_BADGE_CONFIGS.filter(
              (b) => b.role === user.role,
            ).sort((a, b) => b.points - a.points);
            const matched = sorted.find((b) => user.xp >= b.points);
            nextBadge = matched ? matched.title : null;
          }

          if (nextBadge !== user.badgeTitle) {
            this.logger.log(
              `User ${user.id} badge updated from ${user.badgeTitle || 'None'} to ${nextBadge || 'None'}`,
            );
            await tx.user.update({
              where: { id: user.id },
              data: { badgeTitle: nextBadge },
            });

            if (nextBadge !== null) {
              const title = MESSAGES.LOYALTY.NEW_BADGE_TITLE;
              const content = MESSAGES.LOYALTY.NEW_BADGE_BODY(nextBadge);
              await tx.notification.create({
                data: {
                  userId: user.id,
                  title,
                  content,
                  type: NotificationType.LEVEL_UP,
                },
              });
              await this.notificationGateway.sendNotificationToUser(user.id, {
                type: NotificationType.LEVEL_UP,
                title,
                content,
              });
            }
          }
        });
      }
      this.logger.log('Gamification full sweep for badges completed.');
    } catch (err) {
      this.logger.error(
        `Error during gamification full sweep: ${err.message}`,
        err.stack,
      );
    }
  }

  async addJob(
    userId: number,
    action: GamificationJob['action'],
    voucherPointsCost?: number,
  ): Promise<GamificationResult> {
    return new Promise<GamificationResult>((resolve, reject) => {
      this.queue$.next({ userId, action, voucherPointsCost, resolve, reject });
    });
  }

  private async processJob(job: GamificationJob) {
    const { userId, action, voucherPointsCost } = job;
    this.logger.log(
      `Processing points for user ID ${userId}, action: ${action}`,
    );

    // 1. Fetch dynamic config
    const config = await this.prisma.gamificationConfig.findUnique({
      where: { id: 'singleton' },
    });

    const pointsPerLevel = config?.pointsPerLevel ?? POINTS_PER_LEVEL;
    const postReviewPoints =
      config?.postReviewPoints ?? DEFAULT_POST_REVIEW_POINTS;
    const commentPoints = config?.commentPoints ?? DEFAULT_COMMENT_POINTS;
    const likePoints = config?.likePoints ?? DEFAULT_LIKE_POINTS;
    const deductionMultiplier =
      config?.deductionMultiplier ?? DEFAULT_DEDUCTION_MULTIPLIER;
    const levelUpPointsReward =
      config?.levelUpPointsReward ?? DEFAULT_LEVEL_UP_POINTS_REWARD;

    let pointsAmount = 0;

    switch (action) {
      case 'POST_REVIEW':
        pointsAmount = postReviewPoints;
        break;
      case 'COMMENT':
        pointsAmount = commentPoints;
        break;
      case 'REPLY':
        pointsAmount = Math.round(commentPoints / 2);
        break;
      case 'LIKE':
        pointsAmount = likePoints;
        break;
      case 'UNDO_POST_REVIEW':
        pointsAmount = -Math.round(postReviewPoints * deductionMultiplier);
        break;
      case 'UNDO_COMMENT':
        pointsAmount = -Math.round(commentPoints * deductionMultiplier);
        break;
      case 'UNDO_REPLY':
        pointsAmount = -Math.round(
          Math.round(commentPoints / 2) * deductionMultiplier,
        );
        break;
      case 'UNDO_LIKE':
        pointsAmount = -Math.round(likePoints * deductionMultiplier);
        break;
      case 'REDEEM_VOUCHER':
        pointsAmount = -(voucherPointsCost ?? 0);
        break;
      case 'CLAIM_CODE':
        pointsAmount = voucherPointsCost ?? 0;
        break;
      default:
        throw new Error(`Invalid action type: ${action as string}`);
    }

    // Use Prisma transaction to ensure bidirectional data integrity and row updates
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          xp: true,
          level: true,
          highestLevel: true,
          role: true,
          badgeTitle: true,
          name: true,
        },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      let nextPoints = user.points;
      let nextXp = user.xp;
      let nextLevel = user.level;
      let nextHighestLevel = user.highestLevel;
      let rewardEarned = 0;

      if (action === 'REDEEM_VOUCHER') {
        nextPoints = Math.max(MIN_POINTS_OR_XP, user.points + pointsAmount); // pointsAmount is negative voucherPointsCost
      } else if (action === 'CLAIM_CODE') {
        nextPoints = user.points + pointsAmount;
      } else {
        // Social action (like, comment, review)
        nextXp = Math.max(MIN_POINTS_OR_XP, user.xp + pointsAmount); // pointsAmount is reward/deduction amount
        nextLevel = Math.max(
          DEFAULT_STARTING_LEVEL,
          Math.floor(nextXp / pointsPerLevel) + DEFAULT_STARTING_LEVEL,
        );

        if (nextLevel > user.highestLevel) {
          rewardEarned = (nextLevel - user.highestLevel) * levelUpPointsReward;
          nextPoints = user.points + rewardEarned;
          nextHighestLevel = nextLevel;
        } else if (nextLevel < user.level) {
          // Level dropped (e.g. user deleted their post/comment)
          // We update current level, but keep highestLevel intact and do NOT deduct usable points
        }
      }

      // Compute next badge title based on nextXp instead of nextPoints
      const badges = await tx.badgeConfig.findMany({
        where: { role: user.role },
      });

      let nextBadge: string | null = user.badgeTitle;
      if (badges.length > 0) {
        const sorted = badges.sort((a, b) => b.points - a.points);

        // Fetch user stats
        const [reviewsCount, postLikesCount, followersCount, restaurant] =
          await Promise.all([
            tx.post.count({
              where: {
                authorId: userId,
                postType: PostType.REVIEW,
                status: PostStatus.APPROVED,
                deletedAt: null,
              },
            }),
            tx.like.count({
              where: { post: { authorId: userId } },
            }),
            user.role === UserRole.CUSTOMER
              ? tx.userFollow.count({ where: { followingId: userId } })
              : tx.follow.count({ where: { restaurant: { ownerId: userId } } }),
            user.role === UserRole.RESTAURANT
              ? tx.restaurant.findFirst({
                  where: { ownerId: userId },
                  select: { ratingAvg: true, ratingCount: true },
                })
              : null,
          ]);

        const ratingAvg = restaurant?.ratingAvg ?? 0;
        const ratingCount = restaurant?.ratingCount ?? 0;

        const matched = sorted.find((b) => {
          if (nextXp < b.points) return false;
          if (b.minReviews !== null && reviewsCount < b.minReviews)
            return false;
          if (b.minPostLikes !== null && postLikesCount < b.minPostLikes)
            return false;
          if (b.minRatingAvg !== null && ratingAvg < b.minRatingAvg)
            return false;
          if (b.minRatingCount !== null && ratingCount < b.minRatingCount)
            return false;
          if (b.minFollowers !== null && followersCount < b.minFollowers)
            return false;
          return true;
        });

        nextBadge = matched ? matched.title : null;
      } else {
        const sorted = DEFAULT_BADGE_CONFIGS.filter(
          (b) => b.role === user.role,
        ).sort((a, b) => b.points - a.points);
        const matched = sorted.find((b) => nextXp >= b.points);
        nextBadge = matched ? matched.title : null;
      }

      // Update User fields
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: nextPoints,
          xp: nextXp,
          level: nextLevel,
          highestLevel: nextHighestLevel,
          badgeTitle: nextBadge,
        },
      });

      // 3. Level-up or Badge notification (Socket + DB) - only for social actions, not for voucher redemption
      if (action !== 'REDEEM_VOUCHER') {
        if (nextLevel > user.level) {
          const title = MESSAGES.LOYALTY.LEVEL_UP_TITLE;
          const content = MESSAGES.LOYALTY.LEVEL_UP_BODY(nextLevel);
          await tx.notification.create({
            data: {
              userId,
              title,
              content,
              type: NotificationType.LEVEL_UP,
            },
          });
          await this.notificationGateway.sendNotificationToUser(userId, {
            type: NotificationType.LEVEL_UP,
            title,
            content,
          });
        }

        if (nextBadge !== user.badgeTitle && nextBadge !== null) {
          const title = MESSAGES.LOYALTY.NEW_BADGE_TITLE;
          const content = MESSAGES.LOYALTY.NEW_BADGE_BODY(nextBadge);
          await tx.notification.create({
            data: {
              userId,
              title,
              content,
              type: NotificationType.LEVEL_UP,
            },
          });
          await this.notificationGateway.sendNotificationToUser(userId, {
            type: NotificationType.LEVEL_UP,
            title,
            content,
          });
        }
      }

      return {
        points: nextPoints,
        level: nextLevel,
        badgeTitle: nextBadge,
        pointsChanged:
          action === 'REDEEM_VOUCHER' || action === 'CLAIM_CODE'
            ? pointsAmount
            : rewardEarned,
      };
    });
  }
}
