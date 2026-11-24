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
      const existing = await this.prisma.aiFeedback.findFirst({
        where: {
          userId,
          foodId: dto.foodId,
        },
      });

      if (existing && existing.feedbackType === dto.feedbackType) {
        this.logger.log(
          `Deleting/Toggling OFF AI Feedback: User ${userId} | Food ${dto.foodId} | Type ${dto.feedbackType}`,
        );
        await this.prisma.aiFeedback.delete({
          where: {
            id: existing.id,
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
        // Anti-spam: Update if existing, create if new
        if (existing) {
          await this.prisma.aiFeedback.update({
            where: {
              id: existing.id,
            },
            data: {
              feedbackType: dto.feedbackType,
              query: lastMessage?.content || null,
              aiReply: lastAiReply?.content || null,
              createdAt: new Date(),
            },
          });
        } else {
          await this.prisma.aiFeedback.create({
            data: {
              userId,
              conversationId: convId,
              foodId: dto.foodId,
              feedbackType: dto.feedbackType,
              query: lastMessage?.content || null,
              aiReply: lastAiReply?.content || null,
            },
          });
        }

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

      const prefs = (profile.preferences as Record<string, any>) || {};
      const goalStr = prefs.goal
        ? AI_CONSTANTS.GOAL_MAP[prefs.goal] || prefs.goal
        : AI_CONSTANTS.EMBEDDING_LABELS.NO_GOAL;

      const feedbackProfile = await this.getUserPreferenceProfile(userId);

      // Construct a highly enriched embedding text bao gồm cả Persona, Dị ứng và Kiêng khem
      let textToEmbed = `Người dùng thích ${prefs.cuisine || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_CUISINE}. Ngân sách ${prefs.budget || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_BUDGET}. Mục tiêu sức khỏe: ${goalStr}.`;

      if (prefs.persona) {
        textToEmbed += ` Nhóm đối tượng đặc thù: ${prefs.persona}.`;
      }
      if (Array.isArray(prefs.allergies) && prefs.allergies.length > 0) {
        textToEmbed += ` Tuyệt đối dị ứng với: ${prefs.allergies.join(', ')}.`;
      }
      if (Array.isArray(prefs.dislikes) && prefs.dislikes.length > 0) {
        textToEmbed += ` Kiêng và không thích ăn: ${prefs.dislikes.join(', ')}.`;
      }
      if (prefs.specialNotes) {
        textToEmbed += ` Tình trạng thể chất: ${prefs.specialNotes}.`;
      }

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

  async updateUserProfileFacts(
    userId: number,
    newSlots: Partial<{
      allergies?: string[];
      dislikes?: string[];
      likes?: string[];
      persona?: string;
      specialNotes?: string;
      cuisineType?: string;
    }>,
  ): Promise<void> {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });
      if (!profile) return;

      const currentPrefs = (profile.preferences as Record<string, any>) || {};
      let hasChanges = false;
      const updatedPrefs = { ...currentPrefs };

      // 1. Allergies (Chất dị ứng - Merge Set vĩnh viễn)
      if (newSlots.allergies && newSlots.allergies.length > 0) {
        const existingAllergies = Array.isArray(currentPrefs.allergies)
          ? currentPrefs.allergies
          : [];
        const mergedAllergies = Array.from(
          new Set([...existingAllergies, ...newSlots.allergies]),
        );
        if (mergedAllergies.length !== existingAllergies.length) {
          updatedPrefs.allergies = mergedAllergies;
          hasChanges = true;
        }
      }

      // 2. Dislikes (Món/vị không thích, kiêng khem - Merge Set)
      if (newSlots.dislikes && newSlots.dislikes.length > 0) {
        const existingDislikes = Array.isArray(currentPrefs.dislikes)
          ? currentPrefs.dislikes
          : [];
        const mergedDislikes = Array.from(
          new Set([...existingDislikes, ...newSlots.dislikes]),
        );
        if (mergedDislikes.length !== existingDislikes.length) {
          updatedPrefs.dislikes = mergedDislikes;
          hasChanges = true;
        }
      }

      // 3. Persona (Phong cách sống đặc thù: GYM, PREGNANT, VEGAN, STUDENT, WEIGHT_LOSS, WELLNESS, OFFICE)
      if (newSlots.persona && newSlots.persona !== currentPrefs.persona) {
        updatedPrefs.persona = newSlots.persona;
        hasChanges = true;
      }

      // 4. Special Notes (Sức khỏe / hoàn cảnh đặc thù)
      if (
        newSlots.specialNotes &&
        newSlots.specialNotes !== currentPrefs.specialNotes
      ) {
        updatedPrefs.specialNotes = newSlots.specialNotes;
        hasChanges = true;
      }

      // 5. Cuisine preference nếu có gu ổn định và không bị dislike
      if (
        newSlots.cuisineType &&
        !newSlots.dislikes?.includes(newSlots.cuisineType)
      ) {
        if (!currentPrefs.cuisine) {
          updatedPrefs.cuisine = newSlots.cuisineType;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this.logger.log(
          `Updating persistent User Facts for User ${userId}: ${JSON.stringify(updatedPrefs)}`,
        );
        await this.prisma.userProfile.update({
          where: { userId },
          data: { preferences: updatedPrefs },
        });

        // Kích hoạt cập nhật vector embedding của user trong background
        this.updateUserEmbeddingWithFeedback(userId).catch((err: unknown) => {
          this.logger.error(
            'Failed to sync user embedding with new facts:',
            err,
          );
        });
      }
    } catch (error) {
      this.logger.error(`Error updating user profile facts: ${error}`);
    }
  }

  async getUserAiMemory(userId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });
    const prefs = (profile?.preferences as Record<string, any>) || {};

    const [likedFeedbacks, dislikedFeedbacks] = await Promise.all([
      this.prisma.aiFeedback.findMany({
        where: { userId, feedbackType: FeedbackType.LIKE },
        include: {
          food: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiFeedback.findMany({
        where: { userId, feedbackType: FeedbackType.DISLIKE },
        include: {
          food: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      preferences: {
        allergies: Array.isArray(prefs.allergies) ? prefs.allergies : [],
        dislikes: Array.isArray(prefs.dislikes) ? prefs.dislikes : [],
        persona: prefs.persona || null,
        specialNotes: prefs.specialNotes || null,
        cuisine: prefs.cuisine || null,
      },
      likedFoods: likedFeedbacks
        .filter((f) => f.food !== null)
        .map((f) => ({
          id: f.id,
          foodId: f.foodId,
          name: f.food.name,
          price: f.food.price,
          image: f.food.image,
        })),
      dislikedFoods: dislikedFeedbacks
        .filter((f) => f.food !== null)
        .map((f) => ({
          id: f.id,
          foodId: f.foodId,
          name: f.food.name,
          price: f.food.price,
          image: f.food.image,
        })),
    };
  }

  async deleteUserAiMemoryItem(
    userId: number,
    type:
      | 'allergy'
      | 'dislike'
      | 'persona'
      | 'specialNotes'
      | 'cuisine'
      | 'feedback'
      | 'all',
    value?: string | number,
  ) {
    if (type === 'all') {
      await this.prisma.userProfile.updateMany({
        where: { userId },
        data: { preferences: {} },
      });
      await this.clearUserFeedbacks(userId);
      this.updateUserEmbeddingWithFeedback(userId).catch(() => {});
      return { success: true };
    }

    if (type === 'feedback' && value) {
      const feedbackId = Number(value);
      await this.prisma.aiFeedback.deleteMany({
        where: { id: feedbackId, userId },
      });
      this.updateUserEmbeddingWithFeedback(userId).catch(() => {});
      return { success: true };
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });
    if (!profile) return { success: true };

    const prefs = { ...((profile.preferences as Record<string, any>) || {}) };

    if (type === 'allergy' && value) {
      const strVal = String(value).trim().toLowerCase();
      if (Array.isArray(prefs.allergies)) {
        prefs.allergies = prefs.allergies.filter(
          (a: string) => a.trim().toLowerCase() !== strVal,
        );
      }
    } else if (type === 'dislike' && value) {
      const strVal = String(value).trim().toLowerCase();
      if (Array.isArray(prefs.dislikes)) {
        prefs.dislikes = prefs.dislikes.filter(
          (d: string) => d.trim().toLowerCase() !== strVal,
        );
      }
    } else if (type === 'persona') {
      delete prefs.persona;
    } else if (type === 'specialNotes') {
      delete prefs.specialNotes;
    } else if (type === 'cuisine') {
      delete prefs.cuisine;
    }

    await this.prisma.userProfile.update({
      where: { userId },
      data: { preferences: prefs },
    });

    this.updateUserEmbeddingWithFeedback(userId).catch((err) => {
      this.logger.warn(
        `Failed to sync user embedding after deleting memory item: ${err.message}`,
      );
    });

    return { success: true, preferences: prefs };
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
