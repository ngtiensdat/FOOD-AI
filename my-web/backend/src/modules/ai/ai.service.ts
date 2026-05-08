import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  // Lưu Cache Embedding trong bộ nhớ để tiết kiệm chi phí và tăng tốc (LRU cơ bản)
  private embeddingCache: Map<string, number[]> = new Map();
  // Bộ nhớ đệm để chặn Spam (Rate Limit)
  private lastChatTime: Map<number, number> = new Map();

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('CẢNH BÁO: OPENAI_API_KEY chưa được thiết lập trong .env');
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();
    const cachedVector = this.embeddingCache.get(normalizedText);
    if (cachedVector) {
      return cachedVector;
    }

    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const vector = response.data[0].embedding;

    // Giữ cache không vượt quá 1000 câu
    if (this.embeddingCache.size > 1000) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) this.embeddingCache.delete(firstKey);
    }
    this.embeddingCache.set(normalizedText, vector);

    return vector;
  }

  async chat(
    userId: number,
    message: string,
    userLat?: number,
    userLng?: number,
  ) {
    try {
      const cleanMessage = message.trim();

      // 1. Rate Limiting (Chặn spam 5 giây/tin nhắn)
      const now = Date.now();
      const lastTime = this.lastChatTime.get(userId) || 0;
      if (now - lastTime < 5000) {
        return {
          reply:
            'Bạn đang chat hơi nhanh quá. Hãy đợi một vài giây rồi gửi lại nhé! 😊',
          suggestions: [],
        };
      }
      this.lastChatTime.set(userId, now);

      if (!process.env.OPENAI_API_KEY) {
        return {
          reply:
            'Xin lỗi, hệ thống AI hiện đang bảo trì (Thiếu API Key). Vui lòng thử lại sau!',
          suggestions: [],
        };
      }

      // 2. Phân quyền & Bảo mật (Hard Security)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== 'CUSTOMER') {
        return {
          reply: 'Tính năng Trợ lý AI chỉ dành riêng cho Khách hàng.',
          suggestions: [],
        };
      }

      // 3. Lớp kiểm duyệt nội dung (Moderation Layer)
      try {
        const modResponse = await this.openai.moderations.create({
          input: cleanMessage,
        });
        if (modResponse.results[0].flagged) {
          return {
            reply: 'Nội dung của bạn vi phạm tiêu chuẩn cộng đồng.',
            suggestions: [],
          };
        }
      } catch (modErr) {
        console.warn('Moderation API failed:', modErr);
      }

      // 4. Tạo embedding cho câu hỏi (Có dùng Cache)
      const userVector = await this.getEmbedding(cleanMessage);

      // 5. Truy xuất Bộ nhớ dài hạn (Profile + Behavior)
      const [profile, favorites, histories] = await Promise.all([
        this.prisma.userProfile.findUnique({ where: { userId } }),
        this.prisma.favorite.findMany({
          where: { userId },
          include: { food: { select: { name: true } } },
          take: 3,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.history.findMany({
          where: { userId, foodId: { not: null } },
          include: { food: { select: { name: true } } },
          take: 3,
          orderBy: { visitedAt: 'desc' },
        }),
      ]);

      let userPrefContext = '';
      const prefList: string[] = [];

      if (profile && profile.preferences) {
        const prefs = profile.preferences as any;
        const goalMap: any = {
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

      if (prefList.length > 0) {
        userPrefContext = `\nĐÂY LÀ THÔNG TIN NGƯỜI DÙNG:\n${prefList.map((item) => `- ${item}`).join('\n')}\n`;
      }

      // 6. Lấy lịch sử hội thoại
      let conversation = await this.prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: { userId },
        });
      }

      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: cleanMessage,
        },
      });

      const historyMessages = await this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });

      const chatHistory = historyMessages.reverse().map((m) => ({
        role: (m.role === 'AI' ? 'assistant' : m.role.toLowerCase()) as
          | 'user'
          | 'assistant'
          | 'system',
        content: m.content,
      }));

      // 7. Hybrid Ranking Search (Vector + Popularity + Geo Search)
      const vectorStr = `[${userVector.join(',')}]`;
      let foods: any[] = [];
      try {
        // Tích hợp Geo Search: Tính khoảng cách và cộng điểm thưởng cho quán gần user
        // Công thức Ranking: Vector(0.6) + AdminRecommend(0.1) + Featured(0.1) + GeoDistance(0.2)
        foods = await this.prisma.$queryRaw`
          SELECT f.id, f.name, f.price, f.description, f.image, r.name as "restaurantName", r.address, f.lat, f.lng, 
                (
                  (1 - (f.embedding <=> CAST(${vectorStr} AS vector))) * 0.6 + 
                  (CASE WHEN f.is_admin_recommended THEN 0.1 ELSE 0 END) +
                  (CASE WHEN f.is_featured_today THEN 0.1 ELSE 0 END) +
                  (CASE 
                    WHEN CAST(${userLat} AS float) IS NOT NULL AND CAST(${userLng} AS float) IS NOT NULL 
                    THEN (1 / (1 + (point(f.lng, f.lat) <-> point(CAST(${userLng} AS float), CAST(${userLat} AS float))))) * 0.2
                    ELSE 0 
                   END)
                ) as similarity
          FROM foods f
          JOIN restaurants r ON f.restaurant_id = r.id
          WHERE f.is_active = true 
            AND r.is_active = true
            AND f.status = 'APPROVED'
            AND f.embedding IS NOT NULL
          ORDER BY similarity DESC
          LIMIT 5
        `;
      } catch (sqlErr: any) {
        console.error('LỖI SQL HYBRID SEARCH:', sqlErr);
        throw new Error(`Lỗi cơ sở dữ liệu: ${sqlErr.message}`);
      }

      // 8. Gọi AI Chat Completion (Strict Mode)
      const context =
        foods.length > 0
          ? foods
              .map(
                (f) =>
                  `- MÓN: ${f.name} | GIÁ: ${f.price.toLocaleString('vi-VN')}đ | QUÁN: ${f.restaurantName} | ĐỊA CHỈ: ${f.address}`,
              )
              .join('\n')
          : '--- KHÔNG CÓ MÓN PHÙ HỢP ---';

      const currentMetadata = (conversation.metadata as any) || {};
      const contextString = currentMetadata.inferredPreferences
        ? `\n- TRÍ NHỚ: ${currentMetadata.inferredPreferences}`
        : '';

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý ảo Food AI chuyên nghiệp.
            CHỈ dùng dữ liệu thực tế: ${context}
            CHỈ gợi ý món có trong danh sách. Nếu khách hỏi món khác, từ chối khéo léo và lái sang menu hiện có.
            NGỮ CẢNH: ${userPrefContext} ${contextString}
            YÊU CẦU: Trả lời ngắn gọn, mời khách xem thẻ món ăn bên dưới.`,
          },
          ...(chatHistory as any),
        ],
        temperature: 0.2,
      });

      const reply =
        completion.choices[0].message.content ||
        'Xin lỗi, tôi không thể trả lời lúc này.';

      await this.prisma.message.create({
        data: { conversationId: conversation.id, role: 'AI', content: reply },
      });

      if (cleanMessage.length > 10) {
        this.updateConversationMetadata(
          conversation.id,
          cleanMessage,
          reply,
          currentMetadata,
        );
      }

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
    } catch (error: any) {
      console.error('LỖI AI SERVICE:', error);
      return {
        reply: `Trục trặc hệ thống: ${error.message || 'Unknown'}.`,
        suggestions: [],
      };
    }
  }

  // --- HÀM RETRAIN AN TOÀN (BỎ UNSAFE) ---

  async updateFoodEmbedding(foodId: number) {
    try {
      const food = await this.prisma.food.findUnique({
        where: { id: foodId },
        include: { restaurant: true },
      });
      if (!food) return;

      const restaurantInfo = food.restaurant
        ? ` tại ${food.restaurant.name}`
        : '';
      const textToEmbed = `Món ăn: ${food.name}${restaurantInfo}. Giá: ${food.price.toLocaleString('vi-VN')}đ. Mô tả: ${food.description || 'Không có mô tả'}. Tags: ${food.tags.join(', ')}`;

      const embedding = await this.getEmbedding(textToEmbed);
      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE foods SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${foodId}
      `;
      console.log(`[RETRAIN] Đã cập nhật embedding cho món: ${food.name}`);
    } catch (e) {
      console.error('Lỗi Retrain Food:', e);
    }
  }

  async updateUserEmbedding(userId: number) {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });
      if (!profile || !profile.preferences) return;

      const prefs = profile.preferences as any;
      const goalMap: any = {
        muscle_gain: 'Tăng cơ',
        weight_loss: 'Giảm cân',
        eat_clean: 'Ăn sạch',
        enjoy: 'Thưởng thức',
      };

      const goal = goalMap[prefs.goal] || prefs.goal || 'Bình thường';
      const cuisine = prefs.cuisine || 'Đa dạng';
      const budget = prefs.budget || 'Linh hoạt';

      const textToEmbed = `Người dùng có mục tiêu ${goal}. Thích ẩm thực ${cuisine}. Ngân sách ${budget}.`;

      const embedding = await this.getEmbedding(textToEmbed);
      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE user_profiles SET embedding = CAST(${vectorStr} AS vector) WHERE user_id = ${userId}
      `;
      console.log(`[RETRAIN] Đã cập nhật embedding cho User ID: ${userId}`);
    } catch (e) {
      console.error('Lỗi Retrain User Profile:', e);
    }
  }

  // --- CÁC HÀM BỔ TRỢ KHÁC ---

  private async updateConversationMetadata(
    conversationId: number,
    userMsg: string,
    aiReply: string,
    currentMetadata: any,
  ) {
    try {
      const updateCompletion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tóm tắt sở thích ẩm thực mới (dưới 15 từ). Cũ: "${currentMetadata.inferredPreferences || 'N/A'}".`,
          },
          { role: 'user', content: `Hỏi: ${userMsg}\nĐáp: ${aiReply}` },
        ],
        max_tokens: 30,
      });

      const newInferred = updateCompletion.choices[0].message.content?.trim();
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          metadata: { ...currentMetadata, inferredPreferences: newInferred },
        },
      });
    } catch (e) {
      console.error('Lỗi Metadata:', e);
    }
  }

  async getChatContext(userId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true },
    });
    return (
      conversation?.metadata || { inferredPreferences: 'Chưa có thông tin.' }
    );
  }

  async clearChatContext(userId: number) {
    await this.prisma.conversation.updateMany({
      where: { userId },
      data: { metadata: {} },
    });
    return { message: 'Đã xóa sạch trí nhớ AI.' };
  }
}
