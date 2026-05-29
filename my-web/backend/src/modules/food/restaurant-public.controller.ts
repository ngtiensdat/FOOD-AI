// Mục đích: Định nghĩa các API cửa ngõ công khai (public) liên quan đến thông tin nhà hàng và tương tác của người dùng với nhà hàng (Theo dõi/Hủy theo dõi).
// File quan hệ: Nhận request từ Client, gọi FoodService để xử lý nghiệp vụ và áp dụng các Guards để xác thực (JwtAuthOptionalGuard hoặc JwtAuthGuard).
// Chức năng đặc biệt: Cho phép xem thông tin nhà hàng công khai, xem món ăn của nhà hàng theo danh mục, lấy danh sách người theo dõi, và bật/tắt theo dõi (follow) nhà hàng.
// Kiến thức/Design Pattern: Single Responsibility, Public Endpoint Pattern, Dependency Injection, Guard Pattern (JwtAuthGuard, JwtAuthOptionalGuard).
// Các biến, hàm đặc biệt: getPublicRestaurant(), getPublicRestaurantFoods(), getRestaurantFollowers(), getMerchantFollowing(), toggleFollow().

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '../../common/guards/jwt-auth-optional.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import { RestaurantNearbyQueryDto } from './dto/restaurant-nearby-query.dto';

@Controller('restaurants')
export class RestaurantPublicController {
  constructor(private readonly foodService: FoodService) {}

  @Get()
  getPublicRestaurants(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.foodService.getPublicRestaurants({
      search,
      city,
      district,
      tag,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
  }

  @Get('nearby')
  @UseGuards(JwtAuthOptionalGuard)
  getNearbyRestaurants(@Query() query: RestaurantNearbyQueryDto) {
    return this.foodService.getNearbyRestaurants(query);
  }

  @Get(':id/public')
  @UseGuards(JwtAuthOptionalGuard)
  getPublicRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getPublicRestaurant(id, user || undefined);
  }

  @Get(':id/foods')
  @UseGuards(JwtAuthOptionalGuard)
  getPublicRestaurantFoods(
    @Param('id', ParseIntPipe) id: number,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.foodService.getPublicRestaurantFoods(
      id,
      categoryId ? parseInt(categoryId, 10) : undefined,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':id/followers')
  @UseGuards(JwtAuthOptionalGuard)
  getRestaurantFollowers(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getRestaurantFollowers(id, user || undefined);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthOptionalGuard)
  getMerchantFollowing(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getMerchantFollowing(id, user || undefined);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  toggleFollow(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User,
  ) {
    return this.foodService.toggleFollowRestaurant(user.id, id);
  }
}
