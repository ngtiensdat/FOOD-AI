// Mục đích: Cung cấp các thao tác truy vấn cơ sở dữ liệu trực tiếp liên quan đến danh mục món ăn (Category) qua Prisma.
// File quan hệ: Gọi PrismaService, sử dụng các kiểu từ @prisma/client, và được gọi bởi CategoryService.
// Chức năng đặc biệt: Thực hiện các câu truy vấn CRUD cơ bản và lọc danh sách danh mục theo groupId hoặc parentId (danh mục cha) có sắp xếp theo thứ tự hiển thị.
// Kiến thức/Design Pattern: Repository Pattern (tách biệt truy cập dữ liệu và nghiệp vụ), Dependency Injection.
// Các biến, hàm đặc biệt: create(), findAllByGroupId(), findByParentId(), findById(), update(), delete().

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CategoryUncheckedCreateInput) {
    return this.prisma.category.create({
      data,
    });
  }

  async findAllByGroupId(groupId: number) {
    return this.prisma.category.findMany({
      where: { groupId },
      orderBy: { order: 'asc' },
    });
  }

  async findByParentId(parentId: number) {
    return this.prisma.category.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.CategoryUncheckedUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
