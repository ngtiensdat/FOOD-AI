import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../../database/prisma.service';
import { InventoryDeductionService } from '../inventory/inventory-deduction.service';
import { User, UserRole } from '@prisma/client';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: any;
  let inventoryDeductionService: any;

  const mockPrismaService = {
    diningTable: {
      findUnique: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockInventoryDeductionService = {
    deductIngredientsForOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: InventoryDeductionService,
          useValue: mockInventoryDeductionService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
    inventoryDeductionService = module.get<InventoryDeductionService>(
      InventoryDeductionService,
    );

    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const dto = {
      restaurantId: 1,
      tableId: 10,
      subtotal: 100,
      discount: 10,
      total: 90,
      items: [{ foodId: 2, quantity: 2, price: 50 }],
    };

    it('should create order successfully when role is ADMIN', async () => {
      const user = { id: 100, role: UserRole.ADMIN } as unknown as User;

      prisma.diningTable.findUnique.mockResolvedValue({
        id: 10,
        restaurantId: 1,
      });
      prisma.order.create.mockResolvedValue({ id: 999, ...dto });

      const result = await service.createOrder(dto, user);

      expect(result).toBeDefined();
      expect(result.id).toBe(999);
      expect(prisma.diningTable.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: { restaurantId: true },
      });
      expect(
        inventoryDeductionService.deductIngredientsForOrder,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException if dining table does not belong to the restaurant', async () => {
      const user = { id: 100, role: UserRole.ADMIN } as unknown as User;

      // Bàn ăn thuộc về restaurantId 2, nhưng DTO gửi restaurantId 1
      prisma.diningTable.findUnique.mockResolvedValue({
        id: 10,
        restaurantId: 2,
      });

      await expect(service.createOrder(dto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is RESTAURANT but does not own the restaurant', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;

      prisma.diningTable.findUnique.mockResolvedValue({
        id: 10,
        restaurantId: 1,
      });
      // Nhà hàng thuộc sở hữu của user 200, nhưng user gọi API là 100
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 200 });

      await expect(service.createOrder(dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is STAFF but restaurantId does not match user.restaurantId', async () => {
      const user = {
        id: 100,
        role: UserRole.STAFF,
        restaurantId: 2,
      } as unknown as User;

      prisma.diningTable.findUnique.mockResolvedValue({
        id: 10,
        restaurantId: 1,
      });

      await expect(service.createOrder(dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getOrdersByRestaurant', () => {
    it('should allow access for ADMIN role', async () => {
      const user = { id: 100, role: UserRole.ADMIN } as unknown as User;
      const orders = [{ id: 1, restaurantId: 1 }];
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrdersByRestaurant(1, user);

      expect(result).toEqual(orders);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it('should allow access for RESTAURANT role who owns the restaurant', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 100 });
      const orders = [{ id: 1, restaurantId: 1 }];
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrdersByRestaurant(1, user);

      expect(result).toEqual(orders);
    });

    it('should throw ForbiddenException for RESTAURANT role who does not own the restaurant', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 200 });

      await expect(service.getOrdersByRestaurant(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access for STAFF role assigned to this restaurant', async () => {
      const user = {
        id: 100,
        role: UserRole.STAFF,
        restaurantId: 1,
      } as unknown as User;
      const orders = [{ id: 1, restaurantId: 1 }];
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrdersByRestaurant(1, user);

      expect(result).toEqual(orders);
    });

    it('should throw ForbiddenException for STAFF role assigned to another restaurant', async () => {
      const user = {
        id: 100,
        role: UserRole.STAFF,
        restaurantId: 2,
      } as unknown as User;

      await expect(service.getOrdersByRestaurant(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for CUSTOMER role', async () => {
      const user = { id: 100, role: UserRole.CUSTOMER } as unknown as User;

      await expect(service.getOrdersByRestaurant(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
