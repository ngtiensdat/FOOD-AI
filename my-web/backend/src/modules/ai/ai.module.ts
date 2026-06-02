// Mục đích: Khai báo module AI (AiModule), gom nhóm và cấu hình các thành phần liên quan đến chatbot tư vấn ẩm thực và vector database.
// File quan hệ: Import PrismaModule; cung cấp AiController, AiService, VectorRepository; export AiService, VectorRepository.
// Chức năng đặc biệt: Đóng gói và quản lý DI cho các dịch vụ AI và các phương thức truy vấn vector database của dự án Food AI.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class AiModule.

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
  ],
})
export class AiModule {}
