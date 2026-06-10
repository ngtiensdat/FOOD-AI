// Mục đích: Định nghĩa các API cửa ngõ cho việc quản lý, tìm kiếm và thao tác với các món ăn (Food) của cả khách hàng, thương gia và quản trị viên.
// File quan hệ: Nhận request từ Client, gọi FoodService để xử lý nghiệp vụ, được bảo vệ bằng các Guards phân quyền.
// Chức năng đặc biệt: Tìm kiếm món ăn thông thường, tìm kiếm món ăn xung quanh địa lý, lọc món ăn hôm nay/tuần nổi bật, xem danh sách món ăn của merchant hiện tại, track lịch sử xem món ăn và CRUD món ăn đơn lẻ hoặc hàng loạt.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Guard Pattern (JwtAuthGuard, RolesGuard), Decorator Pattern.
// Các biến, hàm đặc biệt: getAllFoods(), getFeaturedToday(), getFeaturedWeekly(), getRecommendedFoods(), getNearbyFoods(), getMerchantFoods(), searchFoods(), trackView(), getRecentViews(), createFood(), createBulkFood(), updateFood(), deleteFood(), toggleRecommendFood(), approveFood().

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';

@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get()
  getAllFoods(@Query() query: FoodQueryDto) {
    return this.foodService.getAllFoods(query);
  }

  @Get('featured-today')
  getFeaturedToday() {
    return this.foodService.getFeaturedToday();
  }

  @Get('featured-weekly')
  getFeaturedWeekly() {
    return this.foodService.getFeaturedWeekly();
  }

  @Get('recommended')
  getRecommendedFoods() {
    return this.foodService.getRecommended();
  }

  @Get('nearby')
  getNearbyFoods(@Query() query: FoodQueryDto) {
    return this.foodService.getNearbyFoods(query);
  }

  @Get('my-foods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.ADMIN)
  getMerchantFoods(@GetUser() user: PrismaClient.User) {
    return this.foodService.getMerchantFoods(user);
  }

  @Get('search')
  searchFoods(@Query('q') query: string) {
    return this.foodService.search(query);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  trackView(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.foodService.trackView(user, id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  toggleFavorite(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.foodService.toggleFavorite(user.id, id);
  }

  @Get('recent-views')
  @UseGuards(JwtAuthGuard)
  getRecentViews(
    @GetUser() user: PrismaClient.User,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.foodService.getRecentFoods(user, parsedLimit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.ADMIN)
  createFood(
    @GetUser() user: PrismaClient.User,
    @Body() createFoodDto: CreateFoodDto,
  ) {
    return this.foodService.createFood(user, createFoodDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.ADMIN)
  createBulkFood(
    @GetUser() user: PrismaClient.User,
    @Body() bulkDto: import('./dto/bulk-create-food.dto').BulkCreateFoodDto,
  ) {
    return this.foodService.createBulk(user, bulkDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.ADMIN)
  updateFood(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodDto: UpdateFoodDto,
  ) {
    return this.foodService.updateFood(user, id, updateFoodDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.ADMIN)
  deleteFood(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.foodService.deleteFood(user, id);
  }

  @Patch(':id/recommend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.ADMIN)
  toggleRecommendFood(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.toggleRecommend(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PrismaClient.UserRole.ADMIN)
  approveFood(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PrismaClient.FoodStatus,
  ) {
    return this.foodService.approveFood(id, status);
  }
}
