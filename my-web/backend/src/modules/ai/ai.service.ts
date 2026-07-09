// Mục đích file này để làm gì: Service điều phối chính (Orchestrator) cho các tác vụ AI chat, quản lý trạng thái, và đề xuất món ăn.
// Các file khác hay file này có ý nghĩa như nào: Nhận yêu cầu từ AiController, phối hợp gọi các dịch vụ con như IntentDetectorService, RecommendationService, ResponseGeneratorService.
// Các chức năng đặc biệt: Xử lý logic hội thoại đa bước, tích hợp ngữ cảnh thời tiết thực tế từ WeatherService, và phản hồi kèm đề xuất món ăn tối ưu.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Orchestrator Pattern, Dependency Injection, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: chat(), getConversations(), createConversation(), deleteConversation(), getConversationDetail().

import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RetryQueueService } from '../../common/services/retry-queue.service';
import { VectorRepository, SearchResult } from './vector.repository';
import { UserRole, MessageRole } from '@prisma/client';

export interface ConversationMetadata {
  title?: string;
  slots?: Record<
    string,
    string | string[] | number | boolean | null | undefined
  >;
  current_stage?: string;
  rejected_food_ids?: number[];
  suggested_food_ids?: number[];
}

export interface FoodSuggestion {
  id: number;
  name: string;
  price: number;
  image: string | null;
  restaurantName: string;
  address: string;
}

const DEFAULT_WEATHER_TEMP = 28;
const CONVERSATION_LOCK_TTL_MS = 10000;
const CONVERSATION_LOCK_RETRIES = 10;
const CONVERSATION_LOCK_RETRY_DELAY_MS = 150;
const SLOT_FILL_MAX_MESSAGES = 3;
const FALLBACK_SUGGESTIONS_COUNT = 2;

import { LIMITS } from '../../common/constants/limits.constant';
import { AI_CONSTANTS } from '../../common/constants/ai.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { AI_PARAMETERS } from './constants/ai-parameters.constant';
import { OpenAIService } from './services/openai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { DialogueStateManagerService } from './services/dialogue-state-manager.service';
import { IntentDetectorService } from './services/intent-detector.service';
import { FoodKnowledgeService } from './services/food-knowledge.service';
import { RecommendationService } from './services/recommendation.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { RedisService } from '../../common/redis/redis.service';
import { AiLearningService } from './services/ai-learning.service';
import { WeatherService, WeatherData } from './services/weather.service';
import { SlotExtractorService } from './services/slot-extractor.service';
import { VectorSyncService } from './services/vector-sync.service';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorRepository: VectorRepository,
    private readonly openaiService: OpenAIService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly stateManager: DialogueStateManagerService,
    private readonly intentDetector: IntentDetectorService,
    private readonly knowledgeService: FoodKnowledgeService,
    private readonly recommendationService: RecommendationService,
    private readonly responseGenerator: ResponseGeneratorService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly aiLearningService: AiLearningService,
    private readonly weatherService: WeatherService,
    private readonly slotExtractor: SlotExtractorService,
    private readonly retryQueueService: RetryQueueService,
    private readonly vectorSyncService: VectorSyncService,
  ) {}

  onModuleInit() {
    this.retryQueueService.registerHandler(async (job) => {
      if (job.type === 'food') {
        await this.updateFoodEmbedding(job.id);
      } else if (job.type === 'user') {
        await this.updateUserEmbedding(job.id);
      } else if (job.type === 'post') {
        await this.updatePostEmbedding(job.id);
      }
    });
  }

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  async getEmbedding(text: string): Promise<number[]> {
    return this.vectorSyncService.getEmbedding(text);
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
    offset = 0,
    currentHour?: number,
  ) {
    const cleanMessage = message.trim();
    const rateLimitKey = `ratelimit:chat:${userId}`;

    // 1. Centralized Redis Rate Limiting
    const isLimited = await this.redisService.isRateLimited(
      rateLimitKey,
      1,
      AI_CONSTANTS.RATE_LIMIT.CHAT_MS,
    );
    if (isLimited) {
      return {
        reply: MESSAGES.AI.RATE_LIMIT_FAST,
        suggestions: [],
      };
    }

    // 2. Client verification
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      return {
        reply: 'Người dùng không tồn tại.',
        suggestions: [],
      };
    }

    // Resolve conversation
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
    const defaultTitle = defaultValues.conversationTitle;

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          metadata: {
            title: defaultTitle,
            slots: {},
            current_stage: 'COLLECTING',
            rejected_food_ids: [],
            suggested_food_ids: [],
          },
        },
      });
    }

    // 2.5 Local Fallback cho các tin nhắn đơn giản (greetings/thanks) để tránh chi phí OpenAI
    const lowercaseMsg = cleanMessage.toLowerCase().trim();
    const greetings = [
      'hello',
      'hi',
      'xin chào',
      'chào bạn',
      'chào',
      'halo',
      'helo',
    ];
    const thanks = [
      'cảm ơn',
      'cám ơn',
      'thank you',
      'thanks',
      'cảm ơn bạn',
      'tks',
      'ty',
    ];

    let localReply = '';
    if (greetings.includes(lowercaseMsg)) {
      localReply =
        'Xin chào! Tôi là AI tư vấn ẩm thực của bạn. Hôm nay tôi có thể giúp gì cho bạn? Bạn muốn tìm món ăn ngon hay quán ăn lân cận?';
    } else if (thanks.includes(lowercaseMsg)) {
      localReply =
        'Rất sẵn lòng! Chúc bạn có những trải nghiệm ẩm thực ngon miệng và thú vị!';
    }

    if (localReply) {
      const releaseLock = await this.redisService.acquireLock(
        `lock:conversation:${conversation.id}`,
        CONVERSATION_LOCK_TTL_MS,
        CONVERSATION_LOCK_RETRIES,
        CONVERSATION_LOCK_RETRY_DELAY_MS,
      );
      try {
        await this.stateManager.saveMessage(
          conversation.id,
          MessageRole.USER,
          cleanMessage,
        );
        await this.stateManager.saveMessage(
          conversation.id,
          MessageRole.SYSTEM,
          localReply,
        );
        return {
          reply: localReply,
          suggestions: [],
        };
      } finally {
        await releaseLock();
      }
    }

    // 3. Centralized Distributed Lock via RedisService
    const releaseLock = await this.redisService.acquireLock(
      `lock:conversation:${conversation.id}`,
      CONVERSATION_LOCK_TTL_MS,
      CONVERSATION_LOCK_RETRIES,
      CONVERSATION_LOCK_RETRY_DELAY_MS,
    );

    try {
      // 4. Save User Message
      await this.stateManager.saveMessage(
        conversation.id,
        MessageRole.USER,
        cleanMessage,
      );

      // Load Dialogue State
      const currentState = await this.stateManager.loadOrCreateState(
        conversation.id,
        userId,
        defaultTitle,
      );

      // 5. Intent and Slot Detection Layer
      const {
        intent,
        slots: llmSlots,
        needs,
        searchQuery,
      } = await this.intentDetector.detectIntentAndSlots(cleanMessage);
      const localSlots = this.slotExtractor.extractSlotsLocally(cleanMessage);
      currentState.slots = {
        ...(currentState.slots || {}),
        ...llmSlots,
        ...localSlots,
      };

      // 6. Dialogue State History Loading
      const chatHistory = await this.stateManager.getChatHistory(
        conversation.id,
        LIMITS.AI_CHAT_HISTORY_PAGINATION,
      );
      const messageCount = chatHistory.length;

      // 7. Get User Context & Preferences & Feedback Profile
      let userPrefContext = '';
      let feedbackProfile: any = undefined;

      if (user.role === UserRole.RESTAURANT) {
        const restaurant = await this.prisma.restaurant.findFirst({
          where: { ownerId: userId },
        });
        if (restaurant) {
          const foods = await this.prisma.food.findMany({
            where: { restaurantId: restaurant.id, deletedAt: null },
            select: { id: true, name: true, price: true },
          });
          const foodIds = foods.map((f) => f.id);
          const [viewCounts, aiCounts] = await Promise.all([
            this.prisma.history.groupBy({
              by: ['foodId'],
              where: { foodId: { in: foodIds } },
              _count: { foodId: true },
            }),
            this.prisma.aiFeedback.groupBy({
              by: ['foodId'],
              where: { foodId: { in: foodIds } },
              _count: { foodId: true },
            }),
          ]);
          const viewMap = new Map(
            viewCounts.map((v) => [v.foodId, v._count.foodId]),
          );
          const aiMap = new Map(
            aiCounts.map((a) => [a.foodId, a._count.foodId]),
          );

          userPrefContext =
            `\nĐÂY LÀ SỐ LIỆU HOẠT ĐỘNG CỦA CỬA HÀNG "${restaurant.name}":\n` +
            foods
              .map(
                (f) =>
                  `- Món "${f.name}" (giá ${f.price.toLocaleString('vi-VN')}đ): ${viewMap.get(f.id) ?? 0} lượt khách xem trực tiếp, ${aiMap.get(f.id) ?? 0} lượt được AI gợi ý cho khách hàng.`,
              )
              .join('\n');
        } else {
          userPrefContext = '\nChưa đăng ký cửa hàng trên hệ thống.';
        }
      } else if (user.role === UserRole.ADMIN) {
        const [totalUsers, totalFoods, totalRestaurants, totalReports] =
          await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.food.count({ where: { deletedAt: null } }),
            this.prisma.restaurant.count({ where: { deletedAt: null } }),
            this.prisma.report.count({ where: { status: 'PENDING' } }),
          ]);
        userPrefContext = `\nTHÔNG TIN HỆ THỐNG DÀNH CHO ADMIN:\n- Tổng số người dùng: ${totalUsers}\n- Tổng số món ăn: ${totalFoods}\n- Tổng số nhà hàng: ${totalRestaurants}\n- Báo cáo lỗi/vi phạm chưa xử lý: ${totalReports}`;
      } else {
        const [profile, favorites, histories, fbProfile] = await Promise.all([
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
          this.aiLearningService.getUserPreferenceProfile(userId),
        ]);
        feedbackProfile = fbProfile;
        userPrefContext = this.promptBuilderService.buildUserPrefContext(
          profile,
          favorites,
          histories,
          feedbackProfile,
        );
      }

      // 8. RAG Embedding Retrieval
      const userVector = await this.openaiService.getEmbedding(
        searchQuery || cleanMessage,
      );

      // 8.5. Auto-detect weather from GPS via Open-Meteo
      let weatherData: WeatherData | null = null;
      if (userLat && userLng) {
        weatherData = await this.weatherService.getCurrentWeather(
          userLat,
          userLng,
        );
      }
      // Allow client override (for testing), otherwise use auto-detected data
      const finalWeather = {
        temperature:
          temperature ?? weatherData?.temperature ?? DEFAULT_WEATHER_TEMP,
        isRaining: isRaining ?? weatherData?.isRaining ?? false,
      };

      // 8.7. Explicit History or Favorites retrieval
      const isHistoryRequest =
        cleanMessage.toLowerCase().includes('đã xem') ||
        cleanMessage.toLowerCase().includes('vừa xem') ||
        cleanMessage.toLowerCase().includes('lịch sử');

      const isFavoriteRequest =
        cleanMessage.toLowerCase().includes('yêu thích') ||
        cleanMessage.toLowerCase().includes('đã thích');

      let customCandidates: SearchResult[] = [];
      if (isHistoryRequest) {
        const historyItems = await this.prisma.history.findMany({
          where: { userId, foodId: { not: null } },
          include: {
            food: {
              include: {
                restaurant: true,
                category: true,
              },
            },
          },
          orderBy: { visitedAt: 'desc' },
          take: 5,
        });
        customCandidates = historyItems
          .filter((h) => h.food !== null)
          .map((h) => {
            const f = h.food!;
            return {
              id: f.id,
              name: f.name,
              price: f.price,
              description: f.description || '',
              image: f.image || '',
              tags: f.tags,
              restaurantName: f.restaurant?.name || '',
              address: f.address || f.restaurant?.address || '',
              lat: f.lat || 0,
              lng: f.lng || 0,
              categoryName: f.category?.name || '',
              embeddingSimilarity: 1.0,
              distance_km: null,
              similarity: 1.0,
            };
          });
      } else if (isFavoriteRequest) {
        const favoriteItems = await this.prisma.favorite.findMany({
          where: { userId },
          include: {
            food: {
              include: {
                restaurant: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        customCandidates = favoriteItems
          .filter((fav) => fav.food !== null)
          .map((fav) => {
            const f = fav.food;
            return {
              id: f.id,
              name: f.name,
              price: f.price,
              description: f.description || '',
              image: f.image || '',
              tags: f.tags,
              restaurantName: f.restaurant?.name || '',
              address: f.address || f.restaurant?.address || '',
              lat: f.lat || 0,
              lng: f.lng || 0,
              categoryName: f.category?.name || '',
              embeddingSimilarity: 1.0,
              distance_km: null,
              similarity: 1.0,
            };
          });
      }

      // 9. Retrieve and Rerank candidates (delegated to RecommendationService)
      let foods: SearchResult[] = [];
      let shouldRecommend = false;

      if (customCandidates.length > 0) {
        foods = customCandidates;
        shouldRecommend = true;
        currentState.current_stage = 'RECOMMENDED';
      } else {
        const result = await this.recommendationService.searchAndRerank(
          userVector,
          currentState,
          userLat,
          userLng,
          city,
          district,
          finalWeather,
          cleanMessage,
          intent,
          needs,
          feedbackProfile,
          offset,
          currentHour,
        );
        foods = result.foods;
        shouldRecommend = result.shouldRecommend;
      }

      const isTriggerRecommend =
        shouldRecommend ||
        currentState.current_stage !== 'COLLECTING' ||
        messageCount >= SLOT_FILL_MAX_MESSAGES;

      let selectedRecommendationFoods: SearchResult[] = [];
      if (isTriggerRecommend) {
        selectedRecommendationFoods = foods;
      } else {
        currentState.current_stage = 'COLLECTING';
      }

      // Check wellness consulting target
      const wellness = this.knowledgeService.getWellnessAdvice(cleanMessage);
      const wellnessInstruction = wellness
        ? `\nTƯ VẤN SỨC KHỎE: ${wellness.advice}\n`
        : '';

      // Prepare Prompt Templates
      // Prepare Prompt Templates — include real weather description if available
      const weatherStr = weatherData
        ? ` Thời tiết: ${weatherData.description}, ${weatherData.temperature}°C (cảm nhận ${weatherData.apparentTemperature}°C), độ ẩm ${weatherData.humidity}%, gió ${weatherData.windSpeedKmh} km/h.`
        : '';
      const resolvedHour =
        currentHour !== undefined ? currentHour : new Date().getHours();
      const currentDayTimeStr = `Bây giờ là ${resolvedHour}:${String(new Date().getMinutes()).padStart(2, '0')} ngày ${new Date().toLocaleDateString('vi-VN')}.${weatherStr}`;
      const missingSlots: string[] = [];
      if (!currentState.slots.cuisineType) missingSlots.push('cuisineType');
      if (!currentState.slots.budget) missingSlots.push('budget');
      if (!currentState.slots.companion) missingSlots.push('companion');
      if (!currentState.slots.mobility) missingSlots.push('mobility');
      if (!currentState.slots.emotion) missingSlots.push('emotion');

      const candidatesSection =
        this.promptBuilderService.buildCandidatesSection(
          selectedRecommendationFoods,
        );

      const promptInstructions =
        !isTriggerRecommend ||
        (selectedRecommendationFoods.length === 0 &&
          messageCount < SLOT_FILL_MAX_MESSAGES)
          ? await this.promptBuilderService.buildSlotFillingPrompt(missingSlots)
          : await this.promptBuilderService.buildRecommendationPrompt();

      const systemPrompt = await this.promptBuilderService.buildSystemPrompt(
        currentDayTimeStr,
        userPrefContext + wellnessInstruction,
        promptInstructions,
        JSON.stringify(currentState.slots),
        candidatesSection,
        user.role,
      );

      // 10. Generate response in single OpenAI Completion (delegated to ResponseGeneratorService)
      const parsedResponse = await this.responseGenerator.generateResponse(
        systemPrompt,
        chatHistory,
        selectedRecommendationFoods,
      );

      // 11. Save AI Response & State safely (handles deletion during generation)
      try {
        await this.stateManager.saveMessage(
          conversation.id,
          MessageRole.AI,
          parsedResponse.reply,
        );

        // 12. Save Updated dialogue state metadata
        const nextTitle =
          parsedResponse.title ||
          (currentState.title === defaultTitle
            ? cleanMessage.length > 25
              ? `${cleanMessage.substring(0, 22)}...`
              : cleanMessage
            : currentState.title);

        await this.stateManager.updateState(
          conversation.id,
          currentState,
          parsedResponse.slots,
          parsedResponse.current_stage,
          nextTitle,
          parsedResponse.suggestedFoodIds,
          parsedResponse.rejected_food_ids,
        );
      } catch (dbError) {
        this.logger.warn(
          `Could not save AI reply or update state for conversation ${conversation.id}. It might have been deleted during generation.`,
        );
      }

      // Filter verified recommendations to return to frontend
      // Cross-validate: check that each LLM-suggested food ID is actually mentioned in the reply text.
      // This prevents mismatch where LLM picks random IDs from candidates that don't match what it said.
      const replyLower = parsedResponse.reply.toLowerCase();

      const crossValidateId = (candidateId: number): boolean => {
        const candidate = selectedRecommendationFoods.find(
          (c) => c.id === candidateId,
        );
        if (!candidate) return false;
        const nameLower = candidate.name.toLowerCase();
        const cleanName = nameLower.split('/')[0].split('-')[0].trim();
        const words = cleanName.split(/\s+/);
        const firstThreeWords = words.slice(0, 3).join(' ');
        // A candidate is "mentioned" if its name (or a significant prefix) appears in the reply
        return (
          (cleanName.length > 3 && replyLower.includes(cleanName)) ||
          (words.length >= 2 &&
            firstThreeWords.length > 5 &&
            replyLower.includes(firstThreeWords))
        );
      };

      // Start with LLM-suggested IDs, but filter out any that aren't actually mentioned in the reply
      const rawSuggestedFoodIds = parsedResponse.suggestedFoodIds.filter((id) =>
        crossValidateId(id),
      );

      // If LLM provided IDs but none passed cross-validation, try text-based extraction as fallback
      // (this handles cases where LLM left suggestedFoodIds empty but mentioned foods in text)
      if (
        rawSuggestedFoodIds.length === 0 &&
        selectedRecommendationFoods.length > 0
      ) {
        for (const candidate of selectedRecommendationFoods) {
          if (crossValidateId(candidate.id)) {
            rawSuggestedFoodIds.push(candidate.id);
          }
        }
      }

      const suggestedIdsSet = new Set(rawSuggestedFoodIds);
      const recommendedFoods = selectedRecommendationFoods.filter((f) =>
        suggestedIdsSet.has(f.id),
      );

      return {
        reply: parsedResponse.reply,
        suggestions: recommendedFoods.map((f) => ({
          id: f.id,
          name: f.name,
          price: f.price,
          image: f.image,
          restaurantName: f.restaurantName,
          address: f.address,
          similarity: f.similarity,
        })),
        quickReplies: parsedResponse.quickReplies,
        assessment: parsedResponse.assessment,
        weather: weatherData
          ? {
              temperature: weatherData.temperature,
              apparentTemperature: weatherData.apparentTemperature,
              humidity: weatherData.humidity,
              isRaining: weatherData.isRaining,
              windSpeedKmh: weatherData.windSpeedKmh,
              description: weatherData.description,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(
        'Lỗi trong luồng AiService.chat:',
        error instanceof Error ? error.stack : error,
      );
      return {
        reply: MESSAGES.AI.SYSTEM_ERROR,
        suggestions: [],
        quickReplies: [],
        assessment: null,
        weather: null,
      };
    } finally {
      await releaseLock();
    }
  }

  private async fetchSuggestionsFromMetadata(
    metadata: ConversationMetadata,
  ): Promise<FoodSuggestion[]> {
    if (
      !metadata ||
      !Array.isArray(metadata.suggested_food_ids) ||
      metadata.suggested_food_ids.length === 0
    ) {
      return [];
    }

    const foodIds = metadata.suggested_food_ids.map((id) => Number(id));
    const dbFoods = await this.prisma.food.findMany({
      where: { id: { in: foodIds } },
      include: { restaurant: true },
    });

    return dbFoods.map((f) => ({
      id: f.id,
      name: f.name,
      price: f.price,
      image: f.image,
      restaurantName: f.restaurant?.name || '',
      address: f.address || f.restaurant?.address || '',
    }));
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

    const metadata = conversation.metadata as unknown as ConversationMetadata;
    const suggestions = await this.fetchSuggestionsFromMetadata(metadata);

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
    return { message: MESSAGES.AI.CHAT_HISTORY_CLEARED };
  }

  /**
   * Dọn dẹp các conversation rỗng (không có message) thừa.
   * Giữ lại tối đa 1 conversation rỗng, xóa các bản trùng.
   */
  private async cleanupEmptyConversations(userId: number) {
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

    return emptyConversations;
  }

  async getConversations(userId: number) {
    await this.cleanupEmptyConversations(userId);

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
      const metadata = (c.metadata as unknown as ConversationMetadata) || {};
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
    const emptyConversations = await this.cleanupEmptyConversations(userId);

    if (emptyConversations.length > 0) {
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
        },
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
      throw new NotFoundException(MESSAGES.AI.CONVERSATION_NOT_FOUND);
    }

    const metadata = conversation.metadata as unknown as ConversationMetadata;
    const suggestions = await this.fetchSuggestionsFromMetadata(metadata);

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
      throw new NotFoundException(MESSAGES.AI.CONVERSATION_NOT_FOUND);
    }

    await this.prisma.message.deleteMany({
      where: { conversationId: id },
    });

    await this.prisma.conversation.delete({
      where: { id },
    });
    return { success: true };
  }

  async updateFoodEmbedding(foodId: number) {
    return this.vectorSyncService.updateFoodEmbedding(foodId);
  }

  async updateUserEmbedding(userId: number) {
    return this.vectorSyncService.updateUserEmbedding(userId);
  }

  async updatePostEmbedding(postId: number) {
    return this.vectorSyncService.updatePostEmbedding(postId);
  }

  async semanticSearch(query: string, limit = 20): Promise<SearchResult[]> {
    const vector = await this.getEmbedding(query);
    return this.vectorRepository.hybridSearch(
      vector,
      undefined,
      undefined,
      limit,
    );
  }
}
