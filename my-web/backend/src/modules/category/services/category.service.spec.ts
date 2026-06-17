/**
 * Mục đích file này: Thực hiện kiểm thử đơn vị (Unit Test) cho CategoryService.
 * Ý nghĩa/Quan hệ: Sử dụng Jest để kiểm tra hoạt động của CategoryService, mock các dependencies (CategoryRepository, CategoryGroupRepository, PrismaService).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryGroupRepository } from '../repositories/category-group.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {},
        },
        {
          provide: CategoryGroupRepository,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
