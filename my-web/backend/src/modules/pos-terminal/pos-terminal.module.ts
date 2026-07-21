import { Module } from '@nestjs/common';
import { PosTerminalService } from './pos-terminal.service';
import { PosTerminalController } from './pos-terminal.controller';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [PosTerminalController],
  providers: [PosTerminalService],
  exports: [PosTerminalService],
})
export class PosTerminalModule {}
