import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReport(
    @GetUser('id') userId: number,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.createReport(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingReports() {
    return this.reportService.getPendingReports();
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolveReport(@Param('id', ParseIntPipe) reportId: number) {
    return this.reportService.resolveReport(reportId);
  }

  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async dismissReport(@Param('id', ParseIntPipe) reportId: number) {
    return this.reportService.dismissReport(reportId);
  }
}
