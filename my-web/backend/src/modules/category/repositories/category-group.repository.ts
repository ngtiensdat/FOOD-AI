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
