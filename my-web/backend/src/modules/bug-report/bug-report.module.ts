import { Module } from '@nestjs/common';
import { BugReportController } from './bug-report.controller';
import { BugReportService } from './bug-report.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BugReportController],
  providers: [BugReportService],
  exports: [BugReportService],
})
export class BugReportModule {}
