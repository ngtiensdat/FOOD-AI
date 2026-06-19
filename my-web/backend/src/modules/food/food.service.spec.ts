import { Test, TestingModule } from '@nestjs/testing';
import { FoodService } from './food.service';
import { FoodRepository } from './food.repository';
import { RestaurantRepository } from './restaurant.repository';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../database/prisma.service';
import { AiLearningService } from '../ai/services/ai-learning.service';
import { CacheService } from '../../common/services/cache.service';
import { User, UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FoodService', () => {
  let service: FoodService;
  let repository: Record<string, jest.Mock>;
  let cacheService: Record<string, jest.Mock>;
  let restaurantRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockFoodRepository = {
      findAll: jest.fn(),
      findRestaurantByOwnerId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const mockRestaurantRepository = {
      findRestaurantById: jest.fn(),
      findRestaurantByOwnerId: jest.fn(),
    };

    const mockCacheService = {
      wrap: jest.fn((key, fetchFn) => fetchFn()),
      invalidatePattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodService,
        { provide: FoodRepository, useValue: mockFoodRepository },
        { provide: RestaurantRepository, useValue: mockRestaurantRepository },
        { provide: AiService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: AiLearningService, useValue: {} },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<FoodService>(FoodService);
    repository = module.get(FoodRepository);
    cacheService = module.get(CacheService);
    restaurantRepository = module.get(RestaurantRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllFoods', () => {
    it('should call repository.findAll and return paginated data', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Pho' }],
        total: 1,
      };
      repository.findAll.mockResolvedValue(mockResult);

      const result = await service.getAllFoods({ city: 'Hanoi' });
      expect(result.data).toEqual(mockResult.data);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('deleteFood', () => {
    const userCustomer = { id: 1, role: UserRole.CUSTOMER } as unknown as User;
    const userRestaurant = {
      id: 2,
      role: UserRole.RESTAURANT,
    } as unknown as User;

    it('should throw NotFoundException if food does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.deleteFood(userCustomer, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is restaurant and does not own the food', async () => {
      repository.findById.mockResolvedValue({
        id: 1,
        restaurant: { ownerId: 99 },
      });

      await expect(service.deleteFood(userRestaurant, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should soft delete and invalidate cache if authorized', async () => {
      repository.findById.mockResolvedValue({
        id: 1,
        restaurant: { ownerId: 2 },
      });
      repository.delete.mockResolvedValue({ id: 1 });

      await service.deleteFood(userRestaurant, 1);
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('foods:*');
    });
  });
});
