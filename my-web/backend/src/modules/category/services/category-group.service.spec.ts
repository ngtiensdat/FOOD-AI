import { Test, TestingModule } from '@nestjs/testing';
import { CategoryGroupService } from './category-group.service';
import { CategoryGroupRepository } from '../repositories/category-group.repository';

describe('CategoryGroupService', () => {
  let service: CategoryGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryGroupService,
        {
          provide: CategoryGroupRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CategoryGroupService>(CategoryGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
