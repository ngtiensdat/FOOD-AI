// Mục đích: Định nghĩa các API cửa ngõ cho việc quản lý tài khoản người dùng, xem và cập nhật hồ sơ, theo dõi/hủy theo dõi người dùng khác.
// File quan hệ: Nhận request từ Client, gọi UserService để xử lý nghiệp vụ và áp dụng các Guards để xác thực và phân quyền (JwtAuthGuard, JwtAuthOptionalGuard).
// Chức năng đặc biệt: Cho phép xem hồ sơ công khai, cập nhật thông tin cá nhân (UpdateProfileDto), lấy danh sách người theo dõi và đang theo dõi của một người dùng, toggle theo dõi người dùng khác.
// Kiến thức/Design Pattern: Single Responsibility, Dependency Injection, Guard Pattern, Decorator Pattern.
// Các biến, hàm đặc biệt: getProfile(), updateProfile(), toggleFollowUser(), getFollowers(), getFollowing().

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '../../common/guards/jwt-auth-optional.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile/:id')
  async getProfile(
    @Param('id') id: string,
    @Query('requesterId') requesterId?: string,
  ) {
    return this.userService.getProfile(
      parseInt(id),
      requesterId ? parseInt(requesterId) : undefined,
    );
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('toggle-follow-user')
  @UseGuards(JwtAuthGuard)
  async toggleFollowUser(
    @GetUser('id') userId: number,
    @Body() body: { followingId: number },
  ) {
    return this.userService.toggleFollow(userId, body.followingId);
  }

  @Get('followers/:id')
  @UseGuards(JwtAuthOptionalGuard)
  async getFollowers(@Param('id') id: string, @GetUser('id') userId?: number) {
    return this.userService.getFollowers(parseInt(id), userId);
  }

  @Get('following/:id')
  @UseGuards(JwtAuthOptionalGuard)
  async getFollowing(@Param('id') id: string, @GetUser('id') userId?: number) {
    return this.userService.getFollowing(parseInt(id), userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.userService.getLeaderboard();
  }
}
