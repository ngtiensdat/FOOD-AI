// Mục đích: Định nghĩa các API cửa ngõ cho đối tác nhà hàng (Restaurant/Merchant) quản lý danh mục món ăn (Category) trong các nhóm danh mục.
// File quan hệ: Nhận request từ Client, gọi CategoryService để xử lý nghiệp vụ, được bảo vệ bởi JwtAuthGuard và RolesGuard(UserRole.RESTAURANT).
// Chức năng đặc biệt: Quản lý danh mục món ăn (CRUD) gắn liền với restaurantId (lấy từ token) để đảm bảo tính an toàn dữ liệu và phân quyền sở hữu.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Guard Pattern, Decorator Pattern.
// Các biến, hàm đặc biệt: create(), findAll(), update(), delete().

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('merchant/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(
    @GetUser('id') restaurantId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categoryService.create(restaurantId, dto);
    return { data };
  }

  @Get()
  async findAll(
    @GetUser('id') restaurantId: number,
    @Query('groupId', ParseIntPipe) groupId: number,
  ) {
    const data = await this.categoryService.findAllByGroupId(
      groupId,
      restaurantId,
    );
    return { data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') restaurantId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.update(id, restaurantId, dto);
    return { data };
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') restaurantId: number,
  ) {
    const data = await this.categoryService.delete(id, restaurantId);
    return { data };
  }
}
