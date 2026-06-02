/**
 * Mục đích file này để làm gì: Phối hợp và điều phối các dịch vụ nhỏ (Sub-services) trong AI Module để quản lý hội thoại và đề xuất ẩm thực (Orchestrator).
 * Các file khác hay file này có ý nghĩa như nào: Gọi PrismaService, VectorRepository và các AI Module Sub-services; được gọi bởi AiController.
 * Các chức năng đặc biệt: Tuân thủ Clean Architecture, phối hợp trích xuất slots, hybrid RAG vector search, Reranking mượt mà và distributed locks.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Orchestrator pattern, Clean Architecture, Dependency Injection.
 * Các biến, hàm đặc biệt trong file: chat(), getConversations(), createConversation(), deleteConversation(), updateFoodEmbedding(), updateUserEmbedding().
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { VectorRepository, SearchResult } from './vector.repository';
import { UserRole, MessageRole } from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { AI_CONSTANTS } from '../../common/constants/ai.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { AI_PARAMETERS } from './constants/ai-parameters.constant';
import {
  DialogueState,
  PromptResponse,
} from './interfaces/dialogue-state.interface';
import { OpenAIService } from './services/openai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { SlotExtractorService } from './services/slot-extractor.service';
import { EmbeddingCacheService } from './services/embedding-cache.service';
import { ConversationStateService } from './services/conversation-state.service';
import { RecommendationService } from './services/recommendation.service';
import { RerankingService } from './services/reranking.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly lastChatTime = new Map<number, number>();

  constructor(
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly prisma: PrismaService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly vectorRepository: VectorRepository,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly openaiService: OpenAIService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly promptBuilderService: PromptBuilderService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly slotExtractorService: SlotExtractorService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly embeddingCacheService: EmbeddingCacheService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly conversationStateService: ConversationStateService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly recommendationService: RecommendationService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly rerankingService: RerankingService,
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly configService: ConfigService,
  ) {}

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  async getEmbedding(text: string): Promise<number[]> {
    return this.openaiService.getEmbedding(text);
  }

  async chat(
    userId: number,
    message: string,
    userLat?: number,
    userLng?: number,
    city?: string,
    district?: string,
    temperature?: number,
    isRaining?: boolean,
    conversationId?: number,
  ) {
    try {
      const cleanMessage = message.trim();
      const now = Date.now();
      const lastTime = this.lastChatTime.get(userId) || 0;
      if (now - lastTime < AI_CONSTANTS.RATE_LIMIT.CHAT_MS) {
        return {
          reply: MESSAGES.AI.RATE_LIMIT_FAST,
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
          reply: MESSAGES.AI.CUSTOMER_ONLY,
          suggestions: [],
        };
      }

      let conversation;
      if (conversationId) {
        conversation = await this.prisma.conversation.findFirst({
          where: { id: conversationId, userId },
        });
      }

      if (!conversation) {
        conversation = await this.prisma.conversation.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      }

      const defaultValues = this.getParam(
        'defaultValues',
        AI_PARAMETERS.DEFAULT_VALUES,
      );
      const conversationTitle = defaultValues.conversationTitle;

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            userId,
            metadata: {
              title: conversationTitle,
              slots: {},
              current_stage: 'COLLECTING',
              rejected_food_ids: [],
              suggested_food_ids: [],
            } as any,
          },
        });
      }

      // 1. Đồng bộ và Xử lý Race Condition bằng Distributed Lock phân tán (Redis NX PX / Memory fallback)
      const releaseLock = await this.conversationStateService.acquireLock(
        conversation.id,
      );
      try {
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

        const messageCount = historyMessages.length;

        // 2. Trích xuất slots và ý định cục bộ bằng bộ phân tích nâng cao tiếng Việt (Synonyms & Fuzzy Matching)
        const localSlots =
          this.slotExtractorService.extractSlotsLocally(cleanMessage);

        const currentState =
          await this.conversationStateService.getConversationMetadata(
            conversation.id,
          );

        currentState.slots = {
          ...(currentState.slots || {}),
          ...localSlots,
        };

        // 3. Tạo vector và thực hiện hybrid search & reranking tối ưu khoảng cách mũ
        const userVector = await this.openaiService.getEmbedding(cleanMessage);

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

        const userPrefContext = this.promptBuilderService.buildUserPrefContext(
          profile,
          favorites,
          histories,
        );

        const { foods, shouldRecommend } =
          await this.recommendationService.searchAndRerank(
            userVector,
            currentState,
            userLat,
            userLng,
            city,
            district,
            { temperature: temperature ?? 28, isRaining: isRaining ?? false },
          );

        const isTriggerRecommend =
          shouldRecommend ||
          currentState.current_stage !== 'COLLECTING' ||
          messageCount >= 3;

        let selectedRecommendationFoods: SearchResult[] = [];
        if (isTriggerRecommend) {
          selectedRecommendationFoods = foods;
        } else {
          currentState.current_stage = 'COLLECTING';
        }

        const chatHistory = [...historyMessages].reverse().map((m) => {
          const role = (
            m.role === MessageRole.AI ? 'assistant' : m.role.toLowerCase()
          ) as any;
          return {
            role,
            content: m.content,
          };
        });

        const currentDate = new Date();
        const currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();
        const currentDayTimeStr = `Bây giờ là ${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute} ngày ${currentDate.toLocaleDateString('vi-VN')}.`;

        const missingSlots: string[] = [];
        if (!currentState.slots.cuisineType) missingSlots.push('cuisineType');
        if (!currentState.slots.budget) missingSlots.push('budget');
        if (!currentState.slots.companion) missingSlots.push('companion');
        if (!currentState.slots.mobility) missingSlots.push('mobility');
        if (!currentState.slots.emotion) missingSlots.push('emotion');

        // 4. Decouple prompt & Tối ưu hóa Token Cost: Candidates gửi lên prompt chỉ chứa các trường cần thiết
        const promptInstructions =
          !isTriggerRecommend ||
          (selectedRecommendationFoods.length === 0 && messageCount < 3)
            ? this.promptBuilderService.buildSlotFillingPrompt(missingSlots)
            : this.promptBuilderService.buildRecommendationPrompt(
                selectedRecommendationFoods.map((f) => ({
                  id: f.id,
                  name: f.name,
                  price: f.price,
                  similarity: f.similarity,
                })),
              );

        const systemPrompt = this.promptBuilderService.buildSystemPrompt(
          currentDayTimeStr,
          userPrefContext,
          promptInstructions,
          JSON.stringify(currentState.slots),
        );

        // 5. Gộp duy nhất 1 lần gọi OpenAI Chat Completion trong JSON Mode
        const responseText = await this.openaiService.chatCompletion(
          systemPrompt,
          chatHistory,
        );

        let parsedResponse: PromptResponse;
        try {
          parsedResponse = JSON.parse(responseText);
          parsedResponse.quickReplies = parsedResponse.quickReplies || [];
          parsedResponse.suggestedFoodIds =
            parsedResponse.suggestedFoodIds || [];
          parsedResponse.slots = parsedResponse.slots || {};
          parsedResponse.rejected_food_ids =
            parsedResponse.rejected_food_ids || [];
        } catch (_err) {
          parsedResponse = {
            reply: responseText,
            suggestedFoodIds: [],
            quickReplies: [],
            slots: {},
            current_stage: 'COLLECTING',
            rejected_food_ids: [],
          };
        }

        const reply = parsedResponse.reply || MESSAGES.AI.SYSTEM_ERROR_FALLBACK;
        const quickReplies = parsedResponse.quickReplies || [];

        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: MessageRole.AI,
            content: reply,
          },
        });

        // 6. Cập nhật và lưu gộp Dialogue State
        const finalSlots = {
          ...(currentState.slots || {}),
          ...(parsedResponse.slots || {}),
          ...localSlots,
        };

        if (finalSlots.budget) finalSlots.budget = Number(finalSlots.budget);

        const mergedState: DialogueState = {
          title: parsedResponse.title || currentState.title,
          slots: finalSlots,
          current_stage:
            parsedResponse.current_stage ||
            currentState.current_stage ||
            'COLLECTING',
          rejected_food_ids: Array.from(
            new Set([
              ...(currentState.rejected_food_ids || []),
              ...(parsedResponse.rejected_food_ids || []),
            ]),
          ),
          suggested_food_ids: [],
        };

        const suggestedIds = new Set(
          (parsedResponse.suggestedFoodIds || []).map((id) => Number(id)),
        );
        let recommendedFoods = selectedRecommendationFoods.filter((f) =>
          suggestedIds.has(Number(f.id)),
        );

        if (
          isTriggerRecommend &&
          selectedRecommendationFoods.length > 0 &&
          recommendedFoods.length === 0
        ) {
          recommendedFoods = selectedRecommendationFoods.slice(0, 2);
        }

        mergedState.suggested_food_ids = recommendedFoods.map((f) =>
          Number(f.id),
        );

        const defaultValues = this.getParam(
          'defaultValues',
          AI_PARAMETERS.DEFAULT_VALUES,
        );
        const conversationTitle = defaultValues.conversationTitle;

        if (parsedResponse.title) {
          mergedState.title = parsedResponse.title;
        } else if (
          !mergedState.title ||
          mergedState.title === conversationTitle
        ) {
          mergedState.title =
            cleanMessage.length > 25
              ? `${cleanMessage.substring(0, 22)}...`
              : cleanMessage;
        }

        await this.conversationStateService.updateConversationMetadata(
          conversation.id,
          mergedState,
        );

        return {
          reply,
          suggestions: recommendedFoods.map((f) => ({
            id: f.id,
            name: f.name,
            price: f.price,
            image: f.image,
            restaurantName: f.restaurantName,
            address: f.address,
            similarity: f.similarity,
          })),
          quickReplies,
        };
      } finally {
        await releaseLock();
      }
    } catch (error: unknown) {
      this.logger.error(
        'LỖI AI SERVICE:',
        error instanceof Error ? error.stack : error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        reply: `${MESSAGES.AI.SYSTEM_ERROR}: ${errorMessage}.`,
        suggestions: [],
        quickReplies: [],
      };
    }
  }

  contextReranking(
    candidates: SearchResult[],
    state: DialogueState,
    userLat?: number,
    userLng?: number,
    weather?: { temperature: number; isRaining: boolean },
  ): SearchResult[] {
    return this.rerankingService.contextReranking(
      candidates,
      state,
      userLat,
      userLng,
      weather,
    );
  }

  async getChatContext(userId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: LIMITS.AI_CHAT_HISTORY_PAGINATION,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) return null;

    let suggestions: any[] = [];
    const metadata = conversation.metadata as any;
    if (
      metadata &&
      Array.isArray(metadata.suggested_food_ids) &&
      metadata.suggested_food_ids.length > 0
    ) {
      const foodIds = metadata.suggested_food_ids.map((id: any) => Number(id));
      const dbFoods = await this.prisma.food.findMany({
        where: { id: { in: foodIds } },
        include: { restaurant: true },
      });
      suggestions = dbFoods.map((f) => ({
        id: f.id,
        name: f.name,
        price: f.price,
        image: f.image,
        restaurantName: f.restaurant?.name || '',
        address: f.address || f.restaurant?.address || '',
      }));
    }

    return {
      ...conversation,
      suggestions,
    };
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

  async getConversations(userId: number) {
    const emptyConversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        messages: { none: {} },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (emptyConversations.length > 1) {
      const toDelete = emptyConversations.slice(1).map((c) => c.id);
      await this.prisma.conversation.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    const list = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return list.map((c) => {
      const metadata = (c.metadata as any) || {};
      let title = metadata.title;
      if (!title && c.messages.length > 0) {
        const firstMsg = c.messages[0].content;
        title =
          firstMsg.length > 30 ? `${firstMsg.substring(0, 27)}...` : firstMsg;
      }
      const defaultValues = this.getParam(
        'defaultValues',
        AI_PARAMETERS.DEFAULT_VALUES,
      );
      const conversationTitle = defaultValues.conversationTitle;

      return {
        id: c.id,
        title: title || conversationTitle,
        createdAt: c.createdAt,
        messageCount: c._count.messages,
      };
    });
  }

  async createConversation(userId: number) {
    const emptyConversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        messages: { none: {} },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (emptyConversations.length > 0) {
      if (emptyConversations.length > 1) {
        const toDelete = emptyConversations.slice(1).map((c) => c.id);
        await this.prisma.conversation.deleteMany({
          where: { id: { in: toDelete } },
        });
      }
      return emptyConversations[0];
    }

    const defaultValues = this.getParam(
      'defaultValues',
      AI_PARAMETERS.DEFAULT_VALUES,
    );
    const conversationTitle = defaultValues.conversationTitle;

    return this.prisma.conversation.create({
      data: {
        userId,
        metadata: {
          title: conversationTitle,
          slots: {},
          current_stage: 'COLLECTING',
          rejected_food_ids: [],
          suggested_food_ids: [],
        } as any,
      },
    });
  }

  async getConversationDetail(userId: number, id: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc hội thoại không tồn tại.');
    }

    let suggestions: any[] = [];
    const metadata = conversation.metadata as any;
    if (
      metadata &&
      Array.isArray(metadata.suggested_food_ids) &&
      metadata.suggested_food_ids.length > 0
    ) {
      const foodIds = metadata.suggested_food_ids.map((fid: any) =>
        Number(fid),
      );
      const dbFoods = await this.prisma.food.findMany({
        where: { id: { in: foodIds } },
        include: { restaurant: true },
      });
      suggestions = dbFoods.map((f) => ({
        id: f.id,
        name: f.name,
        price: f.price,
        image: f.image,
        restaurantName: f.restaurant?.name || '',
        address: f.address || f.restaurant?.address || '',
      }));
    }

    return {
      ...conversation,
      suggestions,
    };
  }

  async deleteConversation(userId: number, id: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc hội thoại không tồn tại.');
    }

    await this.prisma.message.deleteMany({
      where: { conversationId: id },
    });

    await this.prisma.conversation.delete({
      where: { id },
    });
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async parseAndStoreState(
    _conversationId: number,
    _userMessage: string,
    currentState: DialogueState,
    _historyMessages: unknown[] = [],
  ): Promise<DialogueState> {
    return currentState;
  }

  async updateFoodEmbedding(foodId: number) {
    try {
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
    } catch (error) {
      this.logger.error(
        'LỖI CẬP NHẬT EMBEDDING MÓN ĂN:',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async updateUserEmbedding(userId: number) {
    try {
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
    } catch (error) {
      this.logger.error(
        'LỖI CẬP NHẬT EMBEDDING NGƯỜI DÙNG:',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
