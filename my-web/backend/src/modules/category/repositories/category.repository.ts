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
