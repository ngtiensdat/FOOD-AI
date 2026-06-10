// Mục đích: Định nghĩa các API cửa ngõ cho đối tác nhà hàng (Restaurant/Merchant) quản lý nhóm danh mục món ăn (Category Group).
// File quan hệ: Nhận request từ Client, gọi CategoryGroupService để xử lý nghiệp vụ, được bảo vệ nghiêm ngặt bởi JwtAuthGuard và RolesGuard(UserRole.RESTAURANT).
// Chức năng đặc biệt: Tự động trích xuất restaurantId (ID của nhà hàng tương ứng của thương gia) từ thông tin người dùng được đăng nhập trong JWT.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Decorator Pattern (@GetUser, @Roles), Guard Pattern.
// Các biến, hàm đặc biệt: create(), findAll(), update(), delete().

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoryGroupService } from '../services/category-group.service';
import {
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
} from '../dto/category-group.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('merchant/category-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT)
export class CategoryGroupController {
  constructor(private readonly categoryGroupService: CategoryGroupService) {}

  @Post()
  async create(
    @GetUser('id') userId: number,
    @Body() dto: CreateCategoryGroupDto,
  ) {
    const data = await this.categoryGroupService.create(userId, dto);
    return { data };
  }

  @Get()
  async findAll(@GetUser('id') userId: number) {
    const data = await this.categoryGroupService.findAllByRestaurantId(userId);
    return { data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() dto: UpdateCategoryGroupDto,
  ) {
    const data = await this.categoryGroupService.update(id, userId, dto);
    return { data };
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ) {
    const data = await this.categoryGroupService.delete(id, userId);
    return { data };
  }
}
