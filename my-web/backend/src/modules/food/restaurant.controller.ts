// Mục đích: Định nghĩa các API cửa ngõ cho đối tác nhà hàng (Restaurant/Merchant) để tự quản trị thông tin nhà hàng và các chi nhánh của mình.
// File quan hệ: Nhận request từ Client, gọi FoodService để xử lý nghiệp vụ, được bảo vệ nghiêm ngặt bởi JwtAuthGuard và RolesGuard(UserRole.RESTAURANT).
// Chức năng đặc biệt: Cho phép lấy thông tin cửa hàng hiện tại, lấy thông tin tất cả chi nhánh, cập nhật trạng thái đóng/mở cửa, và cập nhật thông tin hồ sơ nhà hàng (giờ mở cửa, số điện thoại liên lạc).
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Guard Pattern, Decorator Pattern.
// Các biến, hàm đặc biệt: getMyRestaurant(), getMyBranches(), updateRestaurantStatus(), updateRestaurantProfile().

import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import { UpdateRestaurantStatusDto } from './dto/update-restaurant-status.dto';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { CreateStaffReviewDto } from './dto/create-staff-review.dto';

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

  @Get('my-restaurant/staffs')
  getMyStaffs(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getMyStaffs(user);
  }

  @Post('my-restaurant/staffs/invite')
  inviteMyStaff(
    @GetUser() user: PrismaClient.User,
    @Body() dto: InviteStaffDto,
  ) {
    return this.restaurantService.inviteMyStaff(user, dto);
  }

  @Patch('my-restaurant/staffs/:id')
  updateMyStaff(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.restaurantService.updateMyStaff(user, id, dto);
  }

  @Delete('my-restaurant/staffs/:id')
  deleteMyStaff(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.restaurantService.removeStaffMember(user, id);
  }

  @Get('my-restaurant/staff-invitations')
  getStaffInvitations(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getStaffInvitations(user);
  }

  @Delete('my-restaurant/staff-invitations/:id')
  revokeInvitation(
    @GetUser() user: PrismaClient.User,
    @Param('id') id: string,
  ) {
    return this.restaurantService.revokeInvitation(user, id);
  }

  @Get('my-restaurant/staff-histories')
  getStaffHistories(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getStaffHistories(user);
  }

  @Get('my-restaurant/staff-reviews')
  getStaffReviews(@GetUser() user: PrismaClient.User) {
    return this.restaurantService.getStaffReviews(user);
  }

  @Post('my-restaurant/staffs/:id/reviews')
  createStaffReview(
    @GetUser() user: PrismaClient.User,
    @Param('id', ParseIntPipe) staffId: number,
    @Body() dto: CreateStaffReviewDto,
  ) {
    return this.restaurantService.createStaffReview(user, staffId, dto);
  }
}
