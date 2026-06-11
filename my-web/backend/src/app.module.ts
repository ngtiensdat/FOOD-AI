// Mục đích: Khởi tạo module gốc của ứng dụng NestJS (Backend)
// Các file khác hay file này có ý nghĩa như nào: Module này cấu hình toàn bộ các module con (Auth, User, Ai, Food, Category, Admin...) và áp dụng các cấu hình toàn cục như Config, Rate limiting, và I18n middleware
// Các chức năng đặc biệt: Cấu hình I18nMiddleware toàn cục cho tất cả các endpoint để xử lý đa ngôn ngữ
// Kiến thức, Design Pattern, nguyên tắc: Áp dụng kiến trúc Module-based của NestJS, Dependency Injection, Middleware Pattern
// Các biến, hàm đặc biệt: AppModule, configure

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { FoodModule } from './modules/food/food.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoryModule } from './modules/category/category.module';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { I18nMiddleware } from './common/i18n/i18n.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    AdminModule,
    AiModule,
    FoodModule,
    ThrottlerModule.forRoot([
      {
        ttl: 600000,
        limit: 5,
      },
    ]),
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes('*');
  }
}
