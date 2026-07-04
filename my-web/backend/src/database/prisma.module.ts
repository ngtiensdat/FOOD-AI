import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { InventoryPrismaService } from './inventory-prisma.service';

@Global()
@Module({
  providers: [PrismaService, InventoryPrismaService],
  exports: [PrismaService, InventoryPrismaService],
})
export class PrismaModule {}
