import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from './table.service';
import { PrismaService } from '../../database/prisma.service';
import { User, UserRole } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TableService', () => {
  let service: TableService;
  let prisma: any;

  const mockPrismaService = {
    diningTable: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TableService>(TableService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getTables', () => {
    it('should allow access for ADMIN', async () => {
      const user = { id: 1, role: UserRole.ADMIN } as unknown as User;
      prisma.diningTable.findMany.mockResolvedValue([{ id: 1, name: 'Bàn 1' }]);

      const result = await service.getTables(1, user);
      expect(result).toHaveLength(1);
    });

    it('should allow access for OWNER of the restaurant', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 100 });
      prisma.diningTable.findMany.mockResolvedValue([{ id: 1, name: 'Bàn 1' }]);

      const result = await service.getTables(1, user);
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if OWNER does not own the restaurant', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 200 });

      await expect(service.getTables(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access for STAFF assigned to the restaurant', async () => {
      const user = {
        id: 100,
        role: UserRole.STAFF,
        restaurantId: 1,
      } as unknown as User;
      prisma.diningTable.findMany.mockResolvedValue([{ id: 1, name: 'Bàn 1' }]);

      const result = await service.getTables(1, user);
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for STAFF assigned to another restaurant', async () => {
      const user = {
        id: 100,
        role: UserRole.STAFF,
        restaurantId: 2,
      } as unknown as User;

      await expect(service.getTables(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateTable', () => {
    const dto = { name: 'Bàn 1 cập nhật' };

    it('should throw NotFoundException if table does not exist', async () => {
      const user = { id: 100, role: UserRole.ADMIN } as unknown as User;
      prisma.diningTable.findUnique.mockResolvedValue(null);

      await expect(service.updateTable(999, dto, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if owner does not own the table's restaurant", async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.diningTable.findUnique.mockResolvedValue({
        id: 1,
        restaurantId: 1,
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 200 });

      await expect(service.updateTable(1, dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update table successfully if authorized', async () => {
      const user = { id: 100, role: UserRole.RESTAURANT } as unknown as User;
      prisma.diningTable.findUnique.mockResolvedValue({
        id: 1,
        restaurantId: 1,
      });
      prisma.restaurant.findUnique.mockResolvedValue({ id: 1, ownerId: 100 });
      prisma.diningTable.findFirst.mockResolvedValue(null);
      prisma.diningTable.update.mockResolvedValue({
        id: 1,
        name: 'Bàn 1 cập nhật',
      });

      const result = await service.updateTable(1, dto, user);
      expect(result.name).toBe('Bàn 1 cập nhật');
    });
  });
});
