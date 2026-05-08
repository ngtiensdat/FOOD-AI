import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    // 1. Tạo Pool kết nối từ thư viện 'pg'
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });

    // 2. Khởi tạo Adapter của Prisma
    const adapter = new PrismaPg(pool);

    // 3. Truyền adapter vào constructor của PrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
