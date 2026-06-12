import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PrismaModule } from '../../database/prisma.module';
import { CommonCacheModule } from '../../common/cache.module';

@Module({
  imports: [PrismaModule, CommonCacheModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
