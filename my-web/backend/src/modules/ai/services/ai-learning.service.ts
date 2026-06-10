// Mục đích file này để làm gì: Service quản lý AI Feedback Learning, cập nhật sở thích người dùng và thống kê phản hồi.
// Các file khác hay file này có ý nghĩa như nào: Được gọi từ AiController.submitFeedback và cung cấp thông tin sở thích cho RerankingService.
// Các chức năng đặc biệt: Tải phản hồi, tính toán cập nhật profile vector sở thích của user, xóa toàn bộ phản hồi đồng bộ hóa với danh sách yêu thích.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility, Dependency Injection, Vector Embeddings.
// Các biến, hàm đặc biệt trong file: saveFeedback(), getUserPreference(), clearUserFeedbacks().

/* eslint-disable unused-imports/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { OpenAIService } from './openai.service';
import { VectorRepository } from '../vector.repository';
import { AiFeedbackDto } from '../dto/ai-feedback.dto';
import { FeedbackType } from '@prisma/client';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';

@Injectable()
export class AiLearningService {
  private readonly logger = new Logger(AiLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly vectorRepository: VectorRepository,
  ) {}

  async saveFeedback(userId: number, dto: AiFeedbackDto): Promise<void> {
    try {
      this.logger.log(
        `Saving AI Feedback: User ${userId} | Food ${dto.foodId} | Type ${dto.feedbackType}`,
      );

      // Resolve conversation ID if not provided
      let convId = dto.conversationId;
      if (!convId) {
        const lastConv = await this.prisma.conversation.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (lastConv) {
          convId = lastConv.id;
        } else {
          const newConv = await this.prisma.conversation.create({
            data: {
              userId,
              metadata: {
                title: 'Hội thoại mới',
                slots: {},
                current_stage: 'COLLECTING',
                rejected_food_ids: [],
                suggested_food_ids: [],
              },
            },
          });
          convId = newConv.id;
        }
      }

      // Fetch last messages to log the query context (optional)
      const lastMessage = await this.prisma.message.findFirst({
        where: { conversationId: convId, role: 'USER' },
        orderBy: { createdAt: 'desc' },
        select: { content: true },
      });

      const lastAiReply = await this.prisma.message.findFirst({
        where: { conversationId: convId, role: 'AI' },
        orderBy: { createdAt: 'desc' },
        select: { content: true },
      });

      // Check if feedback already exists with the same type (Toggle Off)
      const existing = await this.prisma.aiFeedback.findUnique({
        where: {
          userId_foodId: {
            userId,
            foodId: dto.foodId,
          },
        },
      });

      if (existing && existing.feedbackType === dto.feedbackType) {
        this.logger.log(
          `Deleting/Toggling OFF AI Feedback: User ${userId} | Food ${dto.foodId} | Type ${dto.feedbackType}`,
        );
        await this.prisma.aiFeedback.delete({
          where: {
            userId_foodId: {
              userId,
              foodId: dto.foodId,
            },
          },
        });

        // Data Consistency: If deleting a LIKE feedback, also remove from Favorite table
        if (dto.feedbackType === FeedbackType.LIKE) {
          const fav = await this.prisma.favorite.findUnique({
            where: {
              userId_foodId: {
                userId,
                foodId: dto.foodId,
              },
            },
          });
          if (fav) {
            await this.prisma.favorite.delete({
              where: {
                userId_foodId: {
                  userId,
                  foodId: dto.foodId,
                },
              },
            });
          }
        }
      } else {
        // Anti-spam: Upsert feedback (unique per userId and foodId)
        await this.prisma.aiFeedback.upsert({
          where: {
            userId_foodId: {
              userId,
              foodId: dto.foodId,
            },
          },
          create: {
            userId,
            conversationId: convId,
            foodId: dto.foodId,
            feedbackType: dto.feedbackType,
            query: lastMessage?.content || null,
            aiReply: lastAiReply?.content || null,
          },
          update: {
            feedbackType: dto.feedbackType,
            query: lastMessage?.content || null,
            aiReply: lastAiReply?.content || null,
            createdAt: new Date(),
          },
        });

        // Data Consistency: If creating/updating a DISLIKE feedback, also remove from Favorite table
        if (dto.feedbackType === FeedbackType.DISLIKE) {
          const fav = await this.prisma.favorite.findUnique({
            where: {
              userId_foodId: {
                userId,
                foodId: dto.foodId,
              },
            },
          });
          if (fav) {
            await this.prisma.favorite.delete({
              where: {
                userId_foodId: {
                  userId,
                  foodId: dto.foodId,
                },
              },
            });
          }
        }
      }

      // Synchronize/Update User Embedding in the background on any feedback change
      this.updateUserEmbeddingWithFeedback(userId).catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errStack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Failed to update user embedding after feedback change: ${errMsg}`,
          errStack,
        );
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error saving feedback: ${err.message}`, err.stack);
      throw error;
    }
  }

  async getUserPreferenceProfile(userId: number) {
    const feedbacks = await this.prisma.aiFeedback.findMany({
      where: { userId },
      include: {
        food: {
          select: {
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const likedFoodsSet = new Set<string>();
    const likedCategoriesSet = new Set<string>();
    const dislikedFoodsSet = new Set<string>();
    const dislikedCategoriesSet = new Set<string>();

    feedbacks.forEach((fb) => {
      if (!fb.food) return;
      const foodName = fb.food.name;
      const catName = fb.food.category?.name;

      if (fb.feedbackType === FeedbackType.LIKE) {
        likedFoodsSet.add(foodName);
        if (catName) likedCategoriesSet.add(catName);
      } else {
        dislikedFoodsSet.add(foodName);
        if (catName) dislikedCategoriesSet.add(catName);
      }
    });

    return {
      likedFoods: Array.from(likedFoodsSet),
      likedCategories: Array.from(likedCategoriesSet),
      dislikedFoods: Array.from(dislikedFoodsSet),
      dislikedCategories: Array.from(dislikedCategoriesSet),
    };
  }

  async getUserFeedbacks(userId: number) {
    return this.prisma.aiFeedback.findMany({
      where: { userId },
      include: {
        food: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            description: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clearUserFeedbacks(userId: number): Promise<void> {
    try {
      this.logger.log(`Clearing all AI Feedbacks for User ${userId}`);

      // Fetch all LIKE feedbacks first to remove them from Favorite table for consistency
      const likes = await this.prisma.aiFeedback.findMany({
        where: { userId, feedbackType: FeedbackType.LIKE },
        select: { foodId: true },
      });

      const foodIds = likes.map((l) => l.foodId);

      // Delete feedbacks
      await this.prisma.aiFeedback.deleteMany({
        where: { userId },
      });

      // Delete matching favorites
      if (foodIds.length > 0) {
        await this.prisma.favorite.deleteMany({
          where: {
            userId,
            foodId: { in: foodIds },
          },
        });
      }

      // Re-calculate user embedding
      await this.updateUserEmbeddingWithFeedback(userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error clearing user feedbacks: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async updateUserEmbeddingWithFeedback(userId: number): Promise<void> {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });
      if (!profile) return;

      const prefs = (profile.preferences as Record<string, string>) || {};
      const goalStr = prefs.goal
        ? AI_CONSTANTS.GOAL_MAP[prefs.goal] || prefs.goal
        : AI_CONSTANTS.EMBEDDING_LABELS.NO_GOAL;

      const feedbackProfile = await this.getUserPreferenceProfile(userId);

      // Construct a highly enriched embedding text
      let textToEmbed = `Người dùng thích ${prefs.cuisine || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_CUISINE}. Ngân sách ${prefs.budget || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_BUDGET}. Mục tiêu sức khỏe: ${goalStr}.`;

      if (feedbackProfile.likedFoods.length > 0) {
        textToEmbed += ` Món ăn đã thích qua phản hồi: ${feedbackProfile.likedFoods.join(', ')}.`;
      }
      if (feedbackProfile.likedCategories.length > 0) {
        textToEmbed += ` Thể loại món thích: ${feedbackProfile.likedCategories.join(', ')}.`;
      }
      if (feedbackProfile.dislikedFoods.length > 0) {
        textToEmbed += ` Món ăn không thích (disliked): ${feedbackProfile.dislikedFoods.join(', ')}.`;
      }
      if (feedbackProfile.dislikedCategories.length > 0) {
        textToEmbed += ` Thể loại món không thích: ${feedbackProfile.dislikedCategories.join(', ')}.`;
      }

      this.logger.log(
        `Updating User ${userId} embedding with text: "${textToEmbed}"`,
      );
      const embedding = await this.openaiService.getEmbedding(textToEmbed);
      await this.vectorRepository.updateUserEmbedding(userId, embedding);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error updating user embedding with feedback: ${err.message}`,
        err.stack,
      );
    }
  }

  async getFeedbackAnalytics() {
    // 1. Total counts
    const totalLikes = await this.prisma.aiFeedback.count({
      where: { feedbackType: FeedbackType.LIKE },
    });
    const totalDislikes = await this.prisma.aiFeedback.count({
      where: { feedbackType: FeedbackType.DISLIKE },
    });
    const totalFeedbacks = totalLikes + totalDislikes;

    const likeRate =
      totalFeedbacks > 0
        ? Number((totalLikes / totalFeedbacks).toFixed(4))
        : 0.0;
    const dislikeRate =
      totalFeedbacks > 0
        ? Number((totalDislikes / totalFeedbacks).toFixed(4))
        : 0.0;
    const recommendationAccuracy = likeRate; // Simple metric: ratio of likes to total feedback

    // 2. Top Liked Foods
    const likedGroup = await this.prisma.aiFeedback.groupBy({
      by: ['foodId'],
      where: { feedbackType: FeedbackType.LIKE },
      _count: {
        foodId: true,
      },
      orderBy: {
        _count: {
          foodId: 'desc',
        },
      },
      take: 5,
    });

    const topLikedFoods = await Promise.all(
      likedGroup.map(async (group) => {
        const food = await this.prisma.food.findUnique({
          where: { id: group.foodId },
          select: { name: true, price: true },
        });
        return {
          foodId: group.foodId,
          name: food?.name || 'Món ăn không rõ',
          price: food?.price || 0,
          count: group._count.foodId,
        };
      }),
    );

    // 3. Top Disliked Foods
    const dislikedGroup = await this.prisma.aiFeedback.groupBy({
      by: ['foodId'],
      where: { feedbackType: FeedbackType.DISLIKE },
      _count: {
        foodId: true,
      },
      orderBy: {
        _count: {
          foodId: 'desc',
        },
      },
      take: 5,
    });

    const topDislikedFoods = await Promise.all(
      dislikedGroup.map(async (group) => {
        const food = await this.prisma.food.findUnique({
          where: { id: group.foodId },
          select: { name: true, price: true },
        });
        return {
          foodId: group.foodId,
          name: food?.name || 'Món ăn không rõ',
          price: food?.price || 0,
          count: group._count.foodId,
        };
      }),
    );

    return {
      totalFeedbacks,
      totalLikes,
      totalDislikes,
      likeRate,
      dislikeRate,
      recommendationAccuracy,
      topLikedFoods,
      topDislikedFoods,
    };
  }
}
