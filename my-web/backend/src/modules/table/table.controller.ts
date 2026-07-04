import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TableService } from './table.service';
import {
  CreateTableDto,
  UpdateTableDto,
  BulkCreateTablesDto,
  TransferTableDto,
} from './dto/table.dto';
import { UserRole } from '@prisma/client';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async getTables(@Query('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.tableService.getTables(restaurantId);
  }

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createTable(@Body() dto: CreateTableDto) {
    return this.tableService.createTable(dto);
  }

  @Post('bulk')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async bulkCreate(@Body() dto: BulkCreateTablesDto) {
    return this.tableService.bulkCreate(dto);
  }

  @Post('transfer')
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async transferTable(@Body() dto: TransferTableDto) {
    return this.tableService.transferTable(dto);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async updateTable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tableService.updateTable(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteTable(@Param('id', ParseIntPipe) id: number) {
    return this.tableService.deleteTable(id);
  }
}
