// Mục đích: Định nghĩa các API cửa ngõ quản trị dành riêng cho quản trị viên (Admin) để duyệt thành viên, cập nhật thông tin và nhập dữ liệu.
// File quan hệ: Nhận request từ Client, gọi AdminService để xử lý nghiệp vụ và áp dụng các Guards để bảo vệ các tuyến đường (routes).
// Chức năng đặc biệt: Nhận file upload Excel để import dữ liệu đối tác thương gia hàng loạt, có phân quyền quản trị nghiêm ngặt (@Roles(UserRole.ADMIN)).
// Kiến thức/Design Pattern: Single Responsibility (chỉ xử lý định tuyến và xác thực tham số đầu vào), Dependency Injection, Guard Pattern (JwtAuthGuard, RolesGuard), Decorator Pattern.
// Các biến, hàm đặc biệt: getPendingUsers(), updateUserStatus(), getAllFoods(), updateFoodStatus(), getAllUsers(), deleteUser(), importMerchants(), deleteFood(), toggleWeeklyFeatured(), batchUpdateFoods().

import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MESSAGES } from '../../common/constants/messages.constant';

import { AdminUpdateFoodDto } from './dto/admin-update-food.dto';
import { BatchUpdateFoodDto } from './dto/batch-update-food.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('pending-users')
  getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Patch('update-status/:id')
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Get('all-foods')
  getAllFoods() {
    return this.adminService.getAllFoods();
  }

  @Patch('update-food/:id')
  updateFoodStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminUpdateFoodDto,
  ) {
    return this.adminService.updateFood(id, body);
  }

  @Get('users')
  getAllUsers(@Query('role') role?: string) {
    return this.adminService.getAllUsers(role);
  }

  @Delete('user/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Post('import-merchants')
  @UseInterceptors(FileInterceptor('file'))
  importMerchants(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(MESSAGES.ADMIN.FILE_REQUIRED);
    }
    return this.adminService.importMerchantsFromExcel(file.buffer);
  }

  @Delete('food/:id')
  deleteFood(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteFood(id);
  }

  @Patch('food/:id/weekly-featured')
  toggleWeeklyFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body('value') value: boolean,
  ) {
    if (typeof value !== 'boolean') {
      throw new BadRequestException(MESSAGES.ADMIN.VALUE_MUST_BE_BOOLEAN);
    }
    return this.adminService.toggleWeeklyFeatured(id, value);
  }

  @Patch('batch-update-foods')
  batchUpdateFoods(@Body() body: BatchUpdateFoodDto) {
    return this.adminService.batchUpdateFoods(body.updates);
  }
}
