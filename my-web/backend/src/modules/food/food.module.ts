import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [FoodController],
})
export class FoodModule {}
