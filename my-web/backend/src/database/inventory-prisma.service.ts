import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/inventory-client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env sớm trước khi constructor chạy để đảm bảo biến môi trường sẵn sàng
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

@Injectable()
export class InventoryPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const rawUrl =
      process.env['INVENTORY_DATABASE_URL'] ?? 'file:./inventory.db';
    // PrismaBetterSqlite3 nhận config object với url là chuỗi file path
    const adapter = new PrismaBetterSqlite3({ url: rawUrl });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
