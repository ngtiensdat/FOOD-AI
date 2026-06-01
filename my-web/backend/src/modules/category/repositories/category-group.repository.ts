// Mục đích: Cung cấp các thao tác truy vấn cơ sở dữ liệu trực tiếp liên quan đến nhóm danh mục món ăn (Category Group) qua Prisma.
// File quan hệ: Gọi PrismaService, sử dụng các kiểu từ @prisma/client, và được gọi bởi CategoryGroupService, CategoryService.
// Chức năng đặc biệt: Thực hiện các câu truy vấn CRUD cơ bản và lọc danh sách các nhóm danh mục theo restaurantId và sắp xếp theo thứ tự hiển thị (order).
// Kiến thức/Design Pattern: Repository Pattern (tách biệt truy cập dữ liệu và nghiệp vụ), Dependency Injection.
// Các biến, hàm đặc biệt: create(), findAllByRestaurantId(), findById(), update(), delete().

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CategoryGroupUncheckedCreateInput) {
    return this.prisma.categoryGroup.create({
      data,
    });
  }

  async findAllByRestaurantId(restaurantId: number) {
    return this.prisma.categoryGroup.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: number) {
    return this.prisma.categoryGroup.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.CategoryGroupUpdateInput) {
    return this.prisma.categoryGroup.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.categoryGroup.delete({
      where: { id },
    });
  }
}
