import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReportStatus } from '@prisma/client';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async createReport(
    userId: number,
    dto: { targetType: string; targetId: number; content: string },
  ) {
    return this.prisma.report.create({
      data: {
        userId,
        targetType: dto.targetType,
        targetId: Number(dto.targetId),
        content: dto.content,
        status: ReportStatus.PENDING,
      },
    });
  }

  async getPendingReports() {
    return this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
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

  async resolveReport(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    // Resolve report by deleting target content
    await this.prisma.$transaction(async (tx) => {
      if (report.targetType === 'POST') {
        // Soft delete post
        await tx.post.updateMany({
          where: { id: report.targetId },
          data: { deletedAt: new Date() },
        });
      } else if (report.targetType === 'COMMENT') {
        // Delete comment
        await tx.comment.deleteMany({
          where: { id: report.targetId },
        });
      }

      await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.RESOLVED },
      });
    });

    if (report.targetType === 'POST' || report.targetType === 'COMMENT') {
      await this.cacheService.invalidatePattern('posts:*');
    }

    return { success: true };
  }

  async dismissReport(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.REJECTED },
    });

    return { success: true };
  }
}
