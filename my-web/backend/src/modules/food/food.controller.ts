import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
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

  @Get('recent-views')
  @UseGuards(JwtAuthGuard)
  getRecentViews(@GetUser() user: PrismaClient.User) {
    return this.foodService.getRecentFoods(user);
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
