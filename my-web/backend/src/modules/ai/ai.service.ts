import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import OpenAI from 'openai';
import { VectorRepository } from './vector.repository';
import {
  UserProfile,
  Favorite,
  History,
  UserRole,
  MessageRole,
} from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { AI_CONSTANTS } from '../../common/constants/ai.constant';
import { appConfig } from '../../config/app.config';

type FavoriteWithFood = Favorite & { food: { name: string } };
type HistoryWithFood = History & { food: { name: string } | null };

@Injectable()
export class AiService {
  private openai: OpenAI;
  private embeddingCache: Map<string, number[]> = new Map();
  private lastChatTime: Map<number, number> = new Map();

  constructor(
    private prisma: PrismaService,
    private vectorRepository: VectorRepository,
  ) {
    this.openai = new OpenAI({
      apiKey: appConfig().openaiApiKey || 'dummy-key',
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();
    const cachedVector = this.embeddingCache.get(normalizedText);
    if (cachedVector) return cachedVector;

    const response = await this.openai.embeddings.create({
      model: AI_CONSTANTS.MODELS.EMBEDDING,
      input: text,
    });

    const vector = response.data[0].embedding;
    if (this.embeddingCache.size > AI_CONSTANTS.CACHE.MAX_SIZE) {
      const firstKey = this.embeddingCache.keys().next().value as
        | string
        | undefined;
      if (firstKey) this.embeddingCache.delete(firstKey);
    }
    this.embeddingCache.set(normalizedText, vector);
    return vector;
  }

  private buildUserContext(
    profile: UserProfile | null,
    favorites: FavoriteWithFood[],
    histories: HistoryWithFood[],
  ) {
    const prefList: string[] = [];
    if (profile && profile.preferences) {
      const prefs = profile.preferences as Record<string, string>;
      const goalMap: Record<string, string> = {
        muscle_gain: 'Tăng cơ',
        weight_loss: 'Giảm cân',
        eat_clean: 'Ăn sạch',
        enjoy: 'Thưởng thức',
      };
      if (prefs.goal)
        prefList.push(`Mục tiêu: ${goalMap[prefs.goal] || prefs.goal}`);
      if (prefs.cuisine) prefList.push(`Gu: ${prefs.cuisine}`);
      if (prefs.budget) prefList.push(`Ngân sách: ${prefs.budget}`);
    }

    if (favorites.length > 0)
      prefList.push(
        `Yêu thích: ${favorites.map((f) => f.food.name).join(', ')}`,
      );
    if (histories.length > 0)
      prefList.push(
        `Vừa xem: ${histories
          .map((h) => h.food?.name)
          .filter(Boolean)
          .join(', ')}`,
      );

    return prefList.length > 0
      ? `\nĐÂY LÀ THÔNG TIN NGƯỜI DÙNG:\n${prefList.map((item) => `- ${item}`).join('\n')}\n`
      : '';
  }

  async chat(
    userId: number,
    message: string,
    userLat?: number,
    userLng?: number,
    city?: string,
    district?: string,
  ) {
    try {
      const cleanMessage = message.trim();
      const now = Date.now();
      const lastTime = this.lastChatTime.get(userId) || 0;
      if (now - lastTime < AI_CONSTANTS.RATE_LIMIT.CHAT_MS) {
        return {
          reply:
            'Bạn đang chat hơi nhanh quá. Hãy đợi một vài giây rồi gửi lại nhé! 😊',
          suggestions: [],
        };
      }
      this.lastChatTime.set(userId, now);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user || user.role !== UserRole.CUSTOMER) {
        return {
          reply: 'Tính năng Trợ lý AI chỉ dành riêng cho Khách hàng.',
          suggestions: [],
        };
      }

      const userVector = await this.getEmbedding(cleanMessage);
      const [profile, favorites, histories] = await Promise.all([
        this.prisma.userProfile.findUnique({ where: { userId } }),
        this.prisma.favorite.findMany({
          where: { userId },
          include: { food: { select: { name: true } } },
          take: LIMITS.AI_SUGGESTION_COUNT_SMALL,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.history.findMany({
          where: { userId, foodId: { not: null } },
          include: { food: { select: { name: true } } },
          take: LIMITS.AI_SUGGESTION_COUNT_SMALL,
          orderBy: { visitedAt: 'desc' },
        }),
      ]);

      const userPrefContext = this.buildUserContext(
        profile,
        favorites,
        histories,
      );
      let conversation = await this.prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (!conversation)
        conversation = await this.prisma.conversation.create({
          data: { userId },
        });

      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: MessageRole.USER,
          content: cleanMessage,
        },
      });
      const historyMessages = await this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: LIMITS.AI_CHAT_HISTORY_PAGINATION,
      });
      const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        historyMessages.reverse().map((m) => {
          const role = (
            m.role === MessageRole.AI ? 'assistant' : m.role.toLowerCase()
          ) as OpenAI.Chat.Completions.ChatCompletionMessageParam['role'];
          return {
            role,
            content: m.content,
          } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
        });

      const foods = await this.vectorRepository.hybridSearch(
        userVector,
        userLat,
        userLng,
        LIMITS.AI_SUGGESTION_COUNT_MEDIUM,
        city,
        district,
      );
      const context =
        foods.length > 0
          ? foods
              .map(
                (f) =>
                  `- MÓN: ${f.name} | GIÁ: ${f.price.toLocaleString('vi-VN')}đ | QUÁN: ${f.restaurantName} | ĐỊA CHỈ: ${f.address}`,
              )
              .join('\n')
          : '--- KHÔNG CÓ MÓN PHÙ HỢP ---';

      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      const currentDayTimeStr = `Bây giờ là ${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute} ngày ${currentDate.toLocaleDateString('vi-VN')}.`;

      const completion = await this.openai.chat.completions.create({
        model: AI_CONSTANTS.MODELS.CHAT,
        messages: [
          {
            role: 'system',
            content: `Bạn là Food AI - Trợ lý ảo chuyên gia tư vấn ẩm thực thông minh, nhiệt tình và am hiểu khẩu vị.

BỐI CẢNH THỜI GIAN:
${currentDayTimeStr} (Hãy dựa vào giờ này để gợi ý món phù hợp: ví dụ sáng gợi ý ăn sáng/cà phê, trưa cơm tấm/văn phòng, chiều tối ăn vặt/lẩu nướng/trà sữa).

DANH SÁCH MÓN ĂN THỰC TẾ KHẢ DỤNG:
${context}

NGỮ CẢNH KHÁCH HÀNG:
${userPrefContext || '- Chưa có thông tin sở thích'}

QUY TẮC PHẢN HỒI:
1. CHỈ được gợi ý các món ăn có trong danh sách thực tế khả dụng ở trên. TUYỆT ĐỐI không tự ý bịa ra món ăn hoặc nhà hàng khác ngoài danh sách.
2. Nếu khách hàng hỏi món khác không có trong danh sách, hãy từ chối khéo léo, thân thiện và hướng họ chọn các món ngon tương tự hiện có trong danh sách khả dụng.
3. Phân tích ngữ cảnh khách hàng (sở thích mục tiêu, ngân sách, lịch sử đặt, thời gian hiện tại) để đưa ra đề xuất phù hợp và giải thích vì sao có các đề xuất này.
4. Trả lời ngắn gọn, tự nhiên, sinh động (2-3 câu), sử dụng các emoji thích hợp, cuối cùng luôn mời khách hàng click xem thẻ món ăn chi tiết hiển thị ở ngay phía dưới chat.`,
          },
          ...chatHistory,
        ],
        temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE,
      });

      const reply =
        completion.choices[0].message.content ||
        'Xin lỗi, tôi không thể trả lời lúc này.';
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: MessageRole.AI,
          content: reply,
        },
      });

      return {
        reply,
        suggestions: foods.map((f) => ({
          id: f.id,
          name: f.name,
          price: f.price,
          image: f.image,
          restaurantName: f.restaurantName,
          address: f.address,
          similarity: f.similarity,
        })),
      };
    } catch (error: unknown) {
      console.error('LỖI AI SERVICE:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        reply: `Trục trặc hệ thống: ${errorMessage}.`,
        suggestions: [],
      };
    }
  }

  async getChatContext(userId: number) {
    return this.prisma.conversation.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: LIMITS.AI_CHAT_HISTORY_PAGINATION,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clearChatContext(userId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (conversation) {
      await this.prisma.message.deleteMany({
        where: { conversationId: conversation.id },
      });
    }
    return { message: 'Chat history cleared' };
  }

  async updateFoodEmbedding(foodId: number) {
    try {
      const food = await this.prisma.food.findUnique({
        where: { id: foodId },
        include: { restaurant: true },
      });
      if (!food) return;
      const textToEmbed = `Món ăn: ${food.name}. Giá: ${food.price.toLocaleString('vi-VN')}đ. Mô tả: ${food.description || 'Không có mô tả'}.`;
      const embedding = await this.getEmbedding(textToEmbed);
      await this.vectorRepository.updateFoodEmbedding(foodId, embedding);
    } catch (error) {
      console.error('LỖI CẬP NHẬT EMBEDDING MÓN ĂN:', error);
    }
  }

  async updateUserEmbedding(userId: number) {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });
      if (!profile || !profile.preferences) return;
      const prefs = profile.preferences as Record<string, string>;
      const textToEmbed = `Người dùng thích ${prefs.cuisine || 'đa dạng'}. Ngân sách ${prefs.budget || 'linh hoạt'}.`;
      const embedding = await this.getEmbedding(textToEmbed);
      await this.vectorRepository.updateUserEmbedding(userId, embedding);
    } catch (error) {
      console.error('LỖI CẬP NHẬT EMBEDDING NGƯỜI DÙNG:', error);
    }
  }
}
