// Mục đích: Cung cấp dịch vụ quản lý nhóm danh mục món ăn (Category Group) cho nhà hàng, bao gồm thêm, sửa, xóa, và bóc tách cấu trúc thực đơn.
// File quan hệ: Gọi CategoryGroupRepository, tương tác DB qua Prisma và được gọi bởi CategoryGroupController, PublicCategoryController.
// Chức năng đặc biệt: Tự động tra cứu restaurantId liên quan đến userId của chủ nhà hàng; tự động tạo một danh mục con gốc cùng tên khi tạo nhóm danh mục mới.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, SOLID, Error Handling (bắt mã lỗi P2002 từ Prisma để phản hồi trực quan).
// Các biến, hàm đặc biệt: getRestaurantId(), create(), findAllByRestaurantId(), getPublicHierarchy(), update(), delete().

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryGroupRepository } from '../repositories/category-group.repository';
import {
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
} from '../dto/category-group.dto';
import { MESSAGES } from '../../../common/constants/messages.constant';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CategoryGroupService {
  constructor(
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

  async create(userId: number, dto: CreateCategoryGroupDto) {
    const restaurantId = await this.getRestaurantId(userId);
    try {
      // Tạo Group trước
      const group = await this.categoryGroupRepo.create({
        name: dto.name,
        order: dto.order ?? 0,
        restaurantId,
      });

      // Tự động tạo 1 Category gốc cùng tên để người dùng có thể gán món ăn ngay
      await this.prisma.category.create({
        data: {
          name: dto.name,
          order: 0,
          depth: 1,
          groupId: group.id,
        },
      });

      return group;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Tên nhóm này đã tồn tại trong nhà hàng của bạn.',
        );
      }
      throw error;
    }
  }

  async findAllByRestaurantId(userId: number) {
    const restaurantId = await this.getRestaurantId(userId);
    return this.categoryGroupRepo.findAllByRestaurantId(restaurantId);
  }

  async getPublicHierarchy(restaurantId: number) {
    // Fetch groups and their categories
    const groups = await this.categoryGroupRepo[
      'prisma'
    ].categoryGroup.findMany({
      where: { restaurantId },
      include: {
        categories: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build hierarchy recursively on the server side or just return raw and let frontend build it.
    // Given the categories include 'parentId', frontend can easily build the tree,
    // or we can build the tree here. Let's return raw arrays for simplicity.
    return groups;
  }

  async update(id: number, userId: number, dto: UpdateCategoryGroupDto) {
    const restaurantId = await this.getRestaurantId(userId);
    const group = await this.categoryGroupRepo.findById(id);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.GROUP_NOT_FOUND);
    }

    return this.categoryGroupRepo.update(id, {
      name: dto.name,
      order: dto.order,
    });
  }

  async delete(id: number, userId: number) {
    const restaurantId = await this.getRestaurantId(userId);
    const group = await this.categoryGroupRepo.findById(id);
    if (!group || group.restaurantId !== restaurantId) {
      throw new NotFoundException(MESSAGES.CATEGORY.GROUP_NOT_FOUND);
    }

    return this.categoryGroupRepo.delete(id);
  }
}
