import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MerchantImportService } from './merchant-import.service';
import { PrismaModule } from '../../database/prisma.module';
import { UserModule } from '../user/user.module';
import { FoodRepository } from '../food/food.repository';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, UserModule, AiModule],
  controllers: [AdminController],
  providers: [AdminService, MerchantImportService, FoodRepository],
  exports: [AdminService],
})
export class AdminModule {}
