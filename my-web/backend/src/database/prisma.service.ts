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
  readonly pool: Pool;

  constructor(configService: ConfigService) {
    // 1. Tạo Pool kết nối từ thư viện 'pg'
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });

    // 2. Khởi tạo Adapter của Prisma
    const adapter = new PrismaPg(pool);

    // 3. Truyền adapter vào constructor của PrismaClient
    super({ adapter });

    this.pool = pool;

    // 4. Tạo Prisma Client Extension cho tính năng Global Soft Delete
    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const softDeleteModels = ['User', 'Restaurant', 'Food', 'Post'];
            if (
              softDeleteModels.includes(model) &&
              [
                'findMany',
                'findFirst',
                'findUnique',
                'count',
                'aggregate',
                'groupBy',
              ].includes(operation)
            ) {
              const queryArgs = (args || {}) as unknown as {
                where?: { deletedAt?: Date | null };
              };
              const argWhere = queryArgs.where || {};
              if (argWhere.deletedAt === undefined) {
                queryArgs.where = {
                  ...argWhere,
                  deletedAt: null,
                };
              }
              return query(queryArgs);
            }
            return query(args);
          },
        },
      },
    });

    // 5. Sao chép pool và liên kết lifecycle hooks của NestJS sang client mở rộng một cách an toàn
    const instance = extendedClient as unknown as PrismaService;
    Object.assign(instance, {
      pool,
      onModuleInit: this.onModuleInit.bind(instance),
      onModuleDestroy: this.onModuleDestroy.bind(instance),
    });

    return instance;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.pool.end();
  }
}
