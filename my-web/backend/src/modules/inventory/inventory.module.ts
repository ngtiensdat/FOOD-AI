import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryDeductionService } from './inventory-deduction.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryDeductionService],
  exports: [InventoryService, InventoryDeductionService],
})
export class InventoryModule {}
