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
