// Mục đích file này để làm gì: Service điều phối chính (Orchestrator) cho các tác vụ AI chat, quản lý trạng thái, và đề xuất món ăn.
// Các file khác hay file này có ý nghĩa như nào: Nhận yêu cầu từ AiController, phối hợp gọi các dịch vụ con như IntentDetectorService, RecommendationService, ResponseGeneratorService.
// Các chức năng đặc biệt: Xử lý logic hội thoại đa bước, tích hợp ngữ cảnh thời tiết thực tế từ WeatherService, và phản hồi kèm đề xuất món ăn tối ưu.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Orchestrator Pattern, Dependency Injection, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: chat(), getConversations(), createConversation(), deleteConversation(), getConversationDetail().

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
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
import { RedisService } from './services/redis.service';
import { AiLearningService } from './services/ai-learning.service';
import { WeatherService, WeatherData } from './services/weather.service';
import { SlotExtractorService } from './services/slot-extractor.service';

@Injectable()
export class AiService {
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
    if (!user || user.role !== UserRole.CUSTOMER) {
      return {
        reply: MESSAGES.AI.CUSTOMER_ONLY,
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
      const [profile, favorites, histories, feedbackProfile] =
        await Promise.all([
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

      const userPrefContext = this.promptBuilderService.buildUserPrefContext(
        profile,
        favorites,
        histories,
        feedbackProfile,
      );

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
      const currentDayTimeStr = `Bây giờ là ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} ngày ${new Date().toLocaleDateString('vi-VN')}.${weatherStr}`;
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
          ? this.promptBuilderService.buildSlotFillingPrompt(missingSlots)
          : this.promptBuilderService.buildRecommendationPrompt();

      const systemPrompt = this.promptBuilderService.buildSystemPrompt(
        currentDayTimeStr,
        userPrefContext + wellnessInstruction,
        promptInstructions,
        JSON.stringify(currentState.slots),
        candidatesSection,
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
      throw new NotFoundException('Cuộc hội thoại không tồn tại.');
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
