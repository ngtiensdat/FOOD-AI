// Mục đích file này để làm gì: Định nghĩa module NestJS quản lý toàn bộ tính năng và service liên quan đến AI tư vấn ẩm thực.
// Các file khác hay file này có ý nghĩa như nào: Được import vào AppModule, kết nối và cung cấp các controller, service và repository cho module AI.
// Các chức năng đặc biệt: Đăng ký các dịch vụ con phục vụ phân tích ý định (Intent), trích xuất slot, đề xuất món ăn, cache và học máy từ phản hồi.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Dependency Injection, Module Pattern (NestJS).
// Các biến, hàm đặc biệt trong file: AiModule.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from '../../config/ai.config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../database/prisma.module';
import { VectorRepository } from './vector.repository';
import { OpenAIService } from './services/openai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { SlotExtractorService } from './services/slot-extractor.service';
import { EmbeddingCacheService } from './services/embedding-cache.service';
import { ConversationStateService } from './services/conversation-state.service';
import { RecommendationService } from './services/recommendation.service';
import { RerankingService } from './services/reranking.service';
import { IntentDetectorService } from './services/intent-detector.service';
import { DialogueStateManagerService } from './services/dialogue-state-manager.service';
import { BusinessRuleEngineService } from './services/business-rule-engine.service';
import { FoodKnowledgeService } from './services/food-knowledge.service';
import { FoodRetrievalService } from './services/food-retrieval.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { AiLearningService } from './services/ai-learning.service';
import { WeatherService } from './services/weather.service';
import { RetryQueueService } from '../../common/services/retry-queue.service';
import { BudgetTrackerService } from './services/budget-tracker.service';
import { LangchainService } from './services/langchain.service';
import { VectorSyncService } from './services/vector-sync.service';

@Module({
  imports: [PrismaModule, ConfigModule.forFeature(aiConfig)],
  controllers: [AiController],
  providers: [
    AiService,
    VectorRepository,
    OpenAIService,
    PromptBuilderService,
    SlotExtractorService,
    EmbeddingCacheService,
    ConversationStateService,
    RecommendationService,
    RerankingService,
    IntentDetectorService,
    DialogueStateManagerService,
    BusinessRuleEngineService,
    FoodKnowledgeService,
    FoodRetrievalService,
    ResponseGeneratorService,
    AiLearningService,
    WeatherService,
    RetryQueueService,
    BudgetTrackerService,
    LangchainService,
    VectorSyncService,
  ],
  exports: [
    AiService,
    VectorRepository,
    OpenAIService,
    PromptBuilderService,
    SlotExtractorService,
    EmbeddingCacheService,
    ConversationStateService,
    RecommendationService,
    RerankingService,
    IntentDetectorService,
    DialogueStateManagerService,
    BusinessRuleEngineService,
    FoodKnowledgeService,
    FoodRetrievalService,
    ResponseGeneratorService,
    AiLearningService,
    WeatherService,
    RetryQueueService,
    BudgetTrackerService,
    LangchainService,
    VectorSyncService,
  ],
})
export class AiModule {}
