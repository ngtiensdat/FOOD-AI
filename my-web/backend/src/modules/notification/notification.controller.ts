// Mục đích: Định nghĩa các API HTTP cho quản lý thông báo của người dùng (lấy danh sách, đọc, xóa).
// File quan hệ: Nhận request từ Client, gọi NotificationService và bảo vệ bằng JwtAuthGuard.
// Chức năng đặc biệt: Sử dụng GetUser decorator để tự động trích xuất thông tin người dùng từ JWT Token.

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  getNotifications(
    @GetUser() user: PrismaClient.User,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : 20;
    return this.service.getNotifications(user.id, parsedPage, parsedPageSize);
  }

  @Patch('read-all')
  readAll(@GetUser() user: PrismaClient.User) {
    return this.service.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(@GetUser() user: PrismaClient.User, @Param('id') id: string) {
    return this.service.markAsRead(user.id, id);
  }

  @Delete('clear')
  clearAll(@GetUser() user: PrismaClient.User) {
    return this.service.clearAll(user.id);
  }
}
