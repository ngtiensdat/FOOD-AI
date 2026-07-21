// Mục đích: Khởi tạo module gốc của ứng dụng NestJS (Backend)
// Các file khác hay file này có ý nghĩa như nào: Module này cấu hình toàn bộ các module con (Auth, User, Ai, Food, Category, Admin...) và áp dụng các cấu hình toàn cục như Config, Rate limiting, và I18n middleware
// Các chức năng đặc biệt: Cấu hình I18nMiddleware toàn cục cho tất cả các endpoint để xử lý đa ngôn ngữ
// Kiến thức, Design Pattern, nguyên tắc: Áp dụng kiến trúc Module-based của NestJS, Dependency Injection, Middleware Pattern
// Các biến, hàm đặc biệt: AppModule, configure

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { SocialModule } from './modules/social/social.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { OfferModule } from './modules/offer/offer.module';
import { BadgeModule } from './modules/badge/badge.module';
import { ReportModule } from './modules/report/report.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BugReportModule } from './modules/bug-report/bug-report.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { MediaModule } from './modules/media/media.module';
import { MailModule } from './modules/mail/mail.module';
import { RedisModule } from './common/redis/redis.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TableModule } from './modules/table/table.module';
import { ChatModule } from './modules/chat/chat.module';
import { OrderModule } from './modules/order/order.module';
import { PosTerminalModule } from './modules/pos-terminal/pos-terminal.module';
import { HistoryModule } from './modules/history/history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    UserModule,
    AdminModule,
    AiModule,
    FoodModule,
    SocialModule,
    VoucherModule,
    OfferModule,
    BadgeModule,
    ReportModule,
    NotificationModule,
    BugReportModule,
    MediaModule,
    InventoryModule,
    TableModule,
    ChatModule,
    OrderModule,
    PosTerminalModule,
    HistoryModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes('*');
  }
}
