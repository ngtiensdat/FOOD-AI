import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoodController],
})
export class FoodModule {}
