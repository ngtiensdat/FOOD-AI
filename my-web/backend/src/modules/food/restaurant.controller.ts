// Mục đích: Định nghĩa các API cửa ngõ cho đối tác nhà hàng (Restaurant/Merchant) để tự quản trị thông tin nhà hàng và các chi nhánh của mình.
// File quan hệ: Nhận request từ Client, gọi FoodService để xử lý nghiệp vụ, được bảo vệ nghiêm ngặt bởi JwtAuthGuard và RolesGuard(UserRole.RESTAURANT).
// Chức năng đặc biệt: Cho phép lấy thông tin cửa hàng hiện tại, lấy thông tin tất cả chi nhánh, cập nhật trạng thái đóng/mở cửa, và cập nhật thông tin hồ sơ nhà hàng (giờ mở cửa, số điện thoại liên lạc).
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Guard Pattern, Decorator Pattern.
// Các biến, hàm đặc biệt: getMyRestaurant(), getMyBranches(), updateRestaurantStatus(), updateRestaurantProfile().

import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import { UpdateRestaurantStatusDto } from './dto/update-restaurant-status.dto';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PrismaClient.UserRole.RESTAURANT)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('my-restaurant')
  getMyRestaurant(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getMyRestaurant(user);
  }

  @Get('my-branches')
  getMyBranches(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getMyBranches(user);
  }

  @Patch('my-restaurant/status')
  updateRestaurantStatus(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateRestaurantStatusDto,
  ) {
    return this.restaurantService.updateMyRestaurantStatus(user, dto.isActive);
  }

  @Patch('my-restaurant/profile')
  updateRestaurantProfile(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateRestaurantProfileDto,
  ) {
    return this.restaurantService.updateMyRestaurantProfile(user, dto);
  }

  @Get('my-analytics')
  getMyAnalytics(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getMyAnalytics(user);
  }
}
