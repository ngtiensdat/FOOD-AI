// Mục đích: Service quản lý các báo cáo lỗi (Bug Report) gửi từ phía người dùng.
// Ý nghĩa: Cung cấp API có phân quyền để tạo và đọc danh sách bug reports. Chỉ Admin mới có quyền xem toàn bộ danh sách.
// Mô hình dữ liệu: BugReport (id, userId, title, content, status, createdAt).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BugReport } from '@prisma/client';

@Injectable()
export class BugReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    dto: { category: string; description: string; imageUrl?: string },
  ): Promise<BugReport> {
    const title = `[${dto.category.toUpperCase()}] Báo cáo lỗi`;
    const content = dto.imageUrl
      ? `${dto.description}\n\nẢnh đính kèm: ${dto.imageUrl}`
      : dto.description;

    return await this.prisma.bugReport.create({
      data: {
        userId,
        title,
        content,
        status: 'PENDING',
      },
    });
  }

  async getAll(): Promise<BugReport[]> {
    return await this.prisma.bugReport.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
