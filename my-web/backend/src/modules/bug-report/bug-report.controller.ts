import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BugReportService } from './bug-report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole, BugReport } from '@prisma/client';

@Controller('bug-reports')
export class BugReportController {
  constructor(private readonly bugReportService: BugReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBugReport(
    @GetUser('id') userId: number,
    @Body()
    dto: {
      category: string;
      description: string;
      imageUrl?: string;
    },
  ): Promise<BugReport> {
    return await this.bugReportService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllBugReports(): Promise<BugReport[]> {
    return await this.bugReportService.getAll();
  }
}
