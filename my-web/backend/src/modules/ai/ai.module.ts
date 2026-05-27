// Mục đích: Khai báo module AI (AiModule), gom nhóm và cấu hình các thành phần liên quan đến chatbot tư vấn ẩm thực và vector database.
// File quan hệ: Import PrismaModule; cung cấp AiController, AiService, VectorRepository; export AiService, VectorRepository.
// Chức năng đặc biệt: Đóng gói và quản lý DI cho các dịch vụ AI và các phương thức truy vấn vector database của dự án Food AI.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class AiModule.

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../database/prisma.module';
import { VectorRepository } from './vector.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, VectorRepository],
  exports: [AiService, VectorRepository],
})
export class AiModule {}
