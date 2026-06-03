/**
 * Mục đích: Định nghĩa module NestJS quản lý toàn bộ tính năng và service liên quan đến AI tư vấn ẩm thực.
 * File quan hệ: Được import vào AppModule và cung cấp các controller và service cần thiết cho AI.
 */

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
import { RedisService } from './services/redis.service';
import { IntentDetectorService } from './services/intent-detector.service';
import { DialogueStateManagerService } from './services/dialogue-state-manager.service';
import { BusinessRuleEngineService } from './services/business-rule-engine.service';
import { FoodKnowledgeService } from './services/food-knowledge.service';
import { FoodRetrievalService } from './services/food-retrieval.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { AiLearningService } from './services/ai-learning.service';

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
    RedisService,
    IntentDetectorService,
    DialogueStateManagerService,
    BusinessRuleEngineService,
    FoodKnowledgeService,
    FoodRetrievalService,
    ResponseGeneratorService,
    AiLearningService,
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
    RedisService,
    IntentDetectorService,
    DialogueStateManagerService,
    BusinessRuleEngineService,
    FoodKnowledgeService,
    FoodRetrievalService,
    ResponseGeneratorService,
    AiLearningService,
  ],
})
export class AiModule {}
