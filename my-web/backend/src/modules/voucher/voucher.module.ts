import { Module } from '@nestjs/common';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { PrismaModule } from '../../database/prisma.module';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [PrismaModule, BadgeModule],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
