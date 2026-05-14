import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { FoodService } from './food.service';
import { FoodRepository } from './food.repository';
import { AuthorizationService } from '../../common/services/authorization.service';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [FoodController],
  providers: [FoodService, FoodRepository, AuthorizationService],
  exports: [FoodService],
})
export class FoodModule {}
