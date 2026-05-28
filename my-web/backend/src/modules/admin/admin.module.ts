// Mục đích: Khai báo module quản trị (AdminModule), gom nhóm và cấu hình các thành phần liên quan đến quyền quản trị hệ thống và bóc tách dữ liệu thương gia.
// File quan hệ: Import PrismaModule, UserModule, AiModule; cung cấp AdminController, AdminService, MerchantImportService, FoodRepository; export AdminService.
// Chức năng đặc biệt: Thiết lập đóng gói và quản lý Dependency Injection cho toàn bộ module Admin.
// Kiến thức/Design Pattern: NestJS Module Pattern (Đóng gói và tổ chức module), Dependency Injection.
// Các biến, hàm đặc biệt: Class AdminModule.

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MerchantImportService } from './merchant-import.service';
import { PrismaModule } from '../../database/prisma.module';
import { UserModule } from '../user/user.module';
import { FoodRepository } from '../food/food.repository';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, UserModule, AiModule],
  controllers: [AdminController],
  providers: [AdminService, MerchantImportService, FoodRepository],
  exports: [AdminService],
})
export class AdminModule {}
