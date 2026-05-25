import { Test, TestingModule } from '@nestjs/testing';
import { CategoryGroupController } from './category-group.controller';
import { CategoryGroupService } from '../services/category-group.service';

describe('CategoryGroupController', () => {
  let controller: CategoryGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryGroupController],
      providers: [
        {
          provide: CategoryGroupService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CategoryGroupController>(CategoryGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
