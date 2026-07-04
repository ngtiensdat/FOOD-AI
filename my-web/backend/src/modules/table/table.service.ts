import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateTableDto,
  UpdateTableDto,
  BulkCreateTablesDto,
  TransferTableDto,
} from './dto/table.dto';

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  async getTables(restaurantId: number) {
    return this.prisma.diningTable.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async createTable(dto: CreateTableDto) {
    const existing = await this.prisma.diningTable.findFirst({
      where: { restaurantId: dto.restaurantId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Tên bàn ăn này đã tồn tại ở chi nhánh này');
    }

    return this.prisma.diningTable.create({
      data: {
        name: dto.name,
        restaurantId: dto.restaurantId,
        capacity: dto.capacity ?? 4,
        status: 'FREE',
        zone: dto.zone ?? 'Khu chung',
        note: dto.note,
      },
    });
  }

  async bulkCreate(dto: BulkCreateTablesDto) {
    const count = dto.toNumber - dto.fromNumber + 1;
    if (count > 100) {
      throw new ConflictException(
        'Số lượng bàn tạo hàng loạt tối đa là 100 bàn mỗi lần',
      );
    }
    const createdTables: any[] = [];

    // Sử dụng transaction để đảm bảo toàn vẹn dữ liệu khi tạo hàng loạt
    return this.prisma.$transaction(async (tx) => {
      for (let i = dto.fromNumber; i <= dto.toNumber; i++) {
        const name = `${dto.prefix}${i}`.trim();

        // Kiểm tra xem bàn đã tồn tại chưa
        const existing = await tx.diningTable.findFirst({
          where: { restaurantId: dto.restaurantId, name },
        });

        if (!existing) {
          const table = await tx.diningTable.create({
            data: {
              name,
              restaurantId: dto.restaurantId,
              capacity: dto.capacity,
              status: 'FREE',
              zone: dto.zone ?? 'Khu chung',
            },
          });
          createdTables.push(table);
        }
      }
      return createdTables;
    });
  }

  async updateTable(id: number, dto: UpdateTableDto) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) {
      throw new NotFoundException('Không tìm thấy bàn ăn');
    }

    if (dto.name) {
      const existing = await this.prisma.diningTable.findFirst({
        where: {
          restaurantId: table.restaurantId,
          name: dto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'Tên bàn ăn này đã tồn tại ở chi nhánh này',
        );
      }
    }

    return this.prisma.diningTable.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        capacity: dto.capacity,
        zone: dto.zone,
        currentGuests: dto.currentGuests,
        note: dto.note,
      },
    });
  }

  async transferTable(dto: TransferTableDto) {
    const fromTable = await this.prisma.diningTable.findUnique({
      where: { id: dto.fromTableId },
    });
    const toTable = await this.prisma.diningTable.findUnique({
      where: { id: dto.toTableId },
    });

    if (!fromTable || !toTable) {
      throw new NotFoundException('Không tìm thấy bàn ăn nguồn hoặc đích');
    }

    if (fromTable.restaurantId !== toTable.restaurantId) {
      throw new ConflictException('Hai bàn ăn phải thuộc cùng một chi nhánh');
    }

    return this.prisma.$transaction(async (tx) => {
      // Giải phóng bàn cũ
      const updatedFrom = await tx.diningTable.update({
        where: { id: dto.fromTableId },
        data: { status: 'FREE' },
      });

      // Chiếm bàn mới
      const updatedTo = await tx.diningTable.update({
        where: { id: dto.toTableId },
        data: { status: 'OCCUPIED' },
      });

      return { fromTable: updatedFrom, toTable: updatedTo };
    });
  }

  async deleteTable(id: number) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) {
      throw new NotFoundException('Không tìm thấy bàn ăn');
    }

    await this.prisma.diningTable.delete({ where: { id } });
    return { success: true };
  }
}
