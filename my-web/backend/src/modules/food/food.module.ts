// Mục đích: Khai báo module thực đơn và nhà hàng (FoodModule), cấu hình các controller và provider liên quan đến món ăn và hồ sơ cửa hàng.
// File quan hệ: Import PrismaModule, AiModule, AuthModule; cung cấp FoodController, RestaurantController, RestaurantPublicController, FoodService, FoodRepository, AuthorizationService; export FoodService.
// Chức năng đặc biệt: Đóng gói và tổ chức toàn bộ logic CRUD món ăn và thông tin hồ sơ nhà hàng, tích hợp chặt chẽ với AiModule để tạo vector embedding món ăn.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class FoodModule.

import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { RestaurantController } from './restaurant.controller';
import { RestaurantPublicController } from './restaurant-public.controller';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { FoodService } from './food.service';
import { FoodRepository } from './food.repository';
import { AuthorizationService } from '../../common/services/authorization.service';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [
    FoodController,
    RestaurantController,
    RestaurantPublicController,
  ],
  providers: [FoodService, FoodRepository, AuthorizationService],
  exports: [FoodService],
})
export class FoodModule {}
