// Mục đích: Cung cấp dịch vụ quản lý danh mục món ăn (Category) cho nhà hàng, bao gồm việc thêm, sửa, xóa, và tìm kiếm danh mục theo nhóm.
// File quan hệ: Gọi CategoryRepository, CategoryGroupRepository và được gọi bởi CategoryController.
// Chức năng đặc biệt: Xác thực quyền sở hữu danh mục và danh mục cha (Parent Category) liên quan đến cùng một nhóm danh mục và cùng chủ nhà hàng trước khi tạo hoặc chỉnh sửa.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, SOLID, Ownership Verification (chống IDOR).
// Các biến, hàm đặc biệt: getRestaurantId(), create(), findAllByGroupId(), update(), delete().

import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { MESSAGES } from '../../../common/constants/messages.constant';
import { CategoryGroupRepository } from '../repositories/category-group.repository';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly categoryGroupRepo: CategoryGroupRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getRestaurantId(userId: number): Promise<number> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: userId },
      orderBy: { id: 'asc' },
    });
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    return restaurant.id;
  }

  async create(userId: number, dto: CreateCategoryDto) {
    const restaurantId = await this.getRestaurantId(userId);
    // Verify group ownership
    const group = await this.categoryGroupRepo.findById(dto.groupId);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.GROUP_NOT_FOUND);
    }

    // Verify parent ownership if parentId is provided
    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent || parent.groupId !== dto.groupId) {
        throw new NotFoundException(
          'Parent category not found or belongs to a different group',
        );
      }
    }

    try {
      return await this.categoryRepo.create({
        name: dto.name,
        order: dto.order ?? 0,
        depth: dto.depth ?? 2,
        groupId: dto.groupId,
        parentId: dto.parentId,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Tên phân loại này đã tồn tại trong nhóm.',
        );
      }
      throw error;
    }
  }

  async findAllByGroupId(groupId: number, userId: number) {
    const restaurantId = await this.getRestaurantId(userId);
    const group = await this.categoryGroupRepo.findById(groupId);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.GROUP_NOT_FOUND);
    }
    return this.categoryRepo.findAllByGroupId(groupId);
  }

  async update(id: number, userId: number, dto: UpdateCategoryDto) {
    const restaurantId = await this.getRestaurantId(userId);
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    const group = await this.categoryGroupRepo.findById(category.groupId);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    if (dto.parentId && dto.parentId !== category.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent || parent.groupId !== category.groupId) {
        throw new NotFoundException(
          'Parent category not found or belongs to a different group',
        );
      }
    }

    return this.categoryRepo.update(id, {
      name: dto.name,
      order: dto.order,
      parentId: dto.parentId,
      depth: dto.depth,
    });
  }

  async delete(id: number, userId: number) {
    const restaurantId = await this.getRestaurantId(userId);
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    const group = await this.categoryGroupRepo.findById(category.groupId);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    return this.categoryRepo.delete(id);
  }
}
