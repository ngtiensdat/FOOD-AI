import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { VectorRepository } from '../vector.repository';
import { OpenAIService } from './openai.service';
import { RetryQueueService } from '../../../common/services/retry-queue.service';
import { retry } from '../../../common/utils/retry.helper';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';

@Injectable()
export class VectorSyncService {
  private readonly logger = new Logger(VectorSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorRepository: VectorRepository,
    private readonly openaiService: OpenAIService,
    private readonly retryQueueService: RetryQueueService,
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    return this.openaiService.getEmbedding(text);
  }

  async updateFoodEmbedding(foodId: number) {
    try {
      await retry(
        async () => {
          const food = await this.prisma.food.findUnique({
            where: { id: foodId },
            include: { restaurant: true, category: true },
          });
          if (!food) return;
          const tagsStr =
            food.tags && food.tags.length > 0
              ? food.tags.join(', ')
              : AI_CONSTANTS.EMBEDDING_LABELS.NO_TAGS;
          const categoryName =
            food.category?.name || AI_CONSTANTS.EMBEDDING_LABELS.CATEGORY_OTHER;
          const textToEmbed = `Danh mục: ${categoryName}. Món ăn: ${food.name}. Giá: ${food.price.toLocaleString('vi-VN')}đ. Mô tả: ${food.description || AI_CONSTANTS.EMBEDDING_LABELS.NO_DESCRIPTION}. Nhãn: ${tagsStr}.`;
          const embedding = await this.getEmbedding(textToEmbed);
          await this.vectorRepository.updateFoodEmbedding(foodId, embedding);
        },
        3, // 3 retries
        500, // delay 500ms
        2, // exponential backoff
      );
    } catch (error) {
      this.logger.error(
        'LỖI CẬP NHẬT EMBEDDING MÓN ĂN (ĐÃ RETRY 3 LẦN):',
        error instanceof Error ? error.stack : error,
      );
      await this.retryQueueService.pushToQueue('food', foodId).catch((qErr) => {
        this.logger.error('Failed to push food embedding to DLQ:', qErr);
      });
    }
  }

  async updateUserEmbedding(userId: number) {
    try {
      await retry(
        async () => {
          const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
          });
          if (!profile || !profile.preferences) return;
          const prefs = profile.preferences as Record<string, string>;
          const goalStr = prefs.goal
            ? AI_CONSTANTS.GOAL_MAP[prefs.goal] || prefs.goal
            : AI_CONSTANTS.EMBEDDING_LABELS.NO_GOAL;
          const textToEmbed = `Người dùng thích ${prefs.cuisine || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_CUISINE}. Ngân sách ${prefs.budget || AI_CONSTANTS.EMBEDDING_LABELS.DEFAULT_BUDGET}. Mục tiêu sức khỏe: ${goalStr}.`;
          const embedding = await this.getEmbedding(textToEmbed);
          await this.vectorRepository.updateUserEmbedding(userId, embedding);
        },
        3, // 3 retries
        500, // delay 500ms
        2, // exponential backoff
      );
    } catch (error) {
      this.logger.error(
        'LỖI CẬP NHẬT EMBEDDING NGƯỜI DÙNG (ĐÃ RETRY 3 LẦN):',
        error instanceof Error ? error.stack : error,
      );
      await this.retryQueueService.pushToQueue('user', userId).catch((qErr) => {
        this.logger.error('Failed to push user embedding to DLQ:', qErr);
      });
    }
  }

  async updatePostEmbedding(postId: number) {
    try {
      await retry(
        async () => {
          const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
              author: true,
              food: { include: { category: true } },
              restaurant: true,
            },
          });

          if (!post || post.deletedAt) return;

          const authorName = post.author.name || 'Người dùng';
          const titleStr = post.title ? `Tiêu đề: ${post.title}. ` : '';
          const contentStr = post.content ? `Nội dung: ${post.content}. ` : '';
          const foodStr = post.food
            ? `Món ăn liên quan: ${post.food.name} (${post.food.category?.name || ''}). Mô tả món: ${post.food.description || ''}. `
            : '';
          const restaurantStr = post.restaurant
            ? `Nhà hàng liên kết: ${post.restaurant.name}. Địa chỉ: ${post.restaurant.address}. Lĩnh vực ẩm thực: ${post.restaurant.cuisines?.join(', ') || ''}.`
            : '';

          const textToEmbed = `Bài viết ẩm thực của tác giả ${authorName}. ${titleStr}${contentStr}${foodStr}${restaurantStr}`;

          const embedding = await this.getEmbedding(textToEmbed);
          await this.vectorRepository.updatePostEmbedding(postId, embedding);
        },
        3, // 3 retries
        500, // delay 500ms
        2, // exponential backoff
      );
      this.logger.log(`Cập nhật vector thành công cho bài đăng ID: ${postId}`);
    } catch (error) {
      this.logger.error(
        `Lỗi cập nhật vector cho bài đăng ${postId} sau 3 lần thử lại:`,
        error instanceof Error ? error.stack : error,
      );
      await this.retryQueueService.pushToQueue('post', postId).catch((qErr) => {
        this.logger.error(`Không thể đưa bài đăng ${postId} vào DLQ:`, qErr);
      });
    }
  }
}
