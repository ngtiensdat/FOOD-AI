// Mục đích: Cung cấp các thao tác truy vấn cơ sở dữ liệu cho bảng thông báo (Notification) thông qua Prisma.
// File quan hệ: Gọi PrismaService, được gọi bởi NotificationService.
// Chức năng đặc cập nhật trạng thái đã đọc, phân trang danh sách và xóa toàn bộ thông báo của người dùng.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(userId: number, page: number, pageSize: number) {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async count(userId: number) {
    return await this.prisma.notification.count({
      where: { userId },
    });
  }

  async findById(id: string) {
    return await this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return await this.prisma.notification.create({
      data,
    });
  }

  async updateRead(id: string, isRead: boolean) {
    return await this.prisma.notification.update({
      where: { id },
      data: { isRead },
    });
  }

  async updateManyRead(userId: number, isRead: boolean) {
    return await this.prisma.notification.updateMany({
      where: { userId },
      data: { isRead },
    });
  }

  async clearAll(userId: number) {
    return await this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
