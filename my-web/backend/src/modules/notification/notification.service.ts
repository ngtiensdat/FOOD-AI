// Mục đích: Cung cấp logic nghiệp vụ cho việc lấy danh sách, đọc và xóa thông báo của người dùng.
// File quan hệ: Gọi NotificationRepository, NotificationGateway và được gọi bởi NotificationController.
// Chức năng đặc biệt: Phân trang danh sách thông báo, xác minh quyền sở hữu trước khi cập nhật trạng thái đã đọc.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly gateway: NotificationGateway,
  ) {}

  async getNotifications(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const list = await this.repo.findMany(userId, page, pageSize);
    const total = await this.repo.count(userId);
    return {
      data: list.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        type: n.type,
        senderId: n.senderId,
        postId: n.postId,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        pageSize,
      },
    };
  }

  async markAsRead(userId: number, id: string) {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa thông báo này',
      );
    }
    return await this.repo.updateRead(id, true);
  }

  async markAllAsRead(userId: number) {
    await this.repo.updateManyRead(userId, true);
    return { success: true };
  }

  async clearAll(userId: number) {
    await this.repo.clearAll(userId);
    return { success: true };
  }

  async createAndSend(
    userId: number,
    data: {
      type: NotificationType;
      title: string;
      content: string;
      senderId?: number;
    },
  ) {
    return this.gateway.sendNotificationToUser(userId, data);
  }
}
