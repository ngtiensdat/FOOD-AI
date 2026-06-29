// Mục đích: Khai báo module người dùng (UserModule), gom nhóm và cấu hình các thành phần liên quan đến thông tin cá nhân và quan hệ xã hội của người dùng.
// File quan hệ: Import PrismaModule, ConfigModule; cung cấp UserController, UserService, UserRepository; export UserService, UserRepository.
// Chức năng đặc biệt: Thiết lập đóng gói và quản lý Dependency Injection cho các dịch vụ quản lý người dùng và quan hệ theo dõi xã hội.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class UserModule.

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../../database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from '../media/media.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, ConfigModule, MediaModule, AiModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
