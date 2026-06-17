// Mục đích: Khai báo module phân mục (CategoryModule), gom nhóm và cấu hình các thành phần liên quan đến nhóm danh mục và danh mục món ăn.
// File quan hệ: Import PrismaModule; cung cấp CategoryGroupController, CategoryController, PublicCategoryController, CategoryGroupService, CategoryService, CategoryGroupRepository, CategoryRepository; export CategoryGroupService, CategoryService.
// Chức năng đặc biệt: Đóng gói và thiết lập Dependency Injection cho toàn bộ các chức năng phân nhóm danh mục món ăn của nhà hàng.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class CategoryModule.

import { Module } from '@nestjs/common';
import { CategoryGroupController } from './controllers/category-group.controller';
import { CategoryController } from './controllers/category.controller';
import { CategoryGroupService } from './services/category-group.service';
import { CategoryService } from './services/category.service';

import { PrismaModule } from '../../database/prisma.module';
import { CategoryGroupRepository } from './repositories/category-group.repository';
import { CategoryRepository } from './repositories/category.repository';
import { PublicCategoryController } from './controllers/public-category.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CategoryGroupController,
    CategoryController,
    PublicCategoryController,
  ],
  providers: [
    CategoryGroupService,
    CategoryService,
    CategoryGroupRepository,
    CategoryRepository,
  ],
  exports: [CategoryGroupService, CategoryService],
})
export class CategoryModule {}
