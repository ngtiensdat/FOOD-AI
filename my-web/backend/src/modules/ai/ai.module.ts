import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../database/prisma.module';
import { VectorRepository } from './vector.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, VectorRepository],
  exports: [AiService, VectorRepository],
})
export class AiModule {}
