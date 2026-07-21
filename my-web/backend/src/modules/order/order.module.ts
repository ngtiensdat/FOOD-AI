import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../../database/prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PosTerminalModule } from '../pos-terminal/pos-terminal.module';
import { PayosService } from './payos.service';

@Module({
  imports: [InventoryModule, PosTerminalModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService, PayosService],
})
export class OrderModule {}
