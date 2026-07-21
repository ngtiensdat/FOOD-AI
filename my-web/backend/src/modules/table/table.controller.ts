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
import { UserRole, type User } from '@prisma/client';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async getTables(
    @Query('restaurantId', ParseIntPipe) restaurantId: number,
    @GetUser() user: User,
  ) {
    return this.tableService.getTables(restaurantId, user);
  }

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createTable(@Body() dto: CreateTableDto, @GetUser() user: User) {
    return this.tableService.createTable(dto, user);
  }

  @Post('bulk')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async bulkCreate(@Body() dto: BulkCreateTablesDto, @GetUser() user: User) {
    return this.tableService.bulkCreate(dto, user);
  }

  @Post('transfer')
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async transferTable(@Body() dto: TransferTableDto, @GetUser() user: User) {
    return this.tableService.transferTable(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.STAFF, UserRole.ADMIN)
  async updateTable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTableDto,
    @GetUser() user: User,
  ) {
    return this.tableService.updateTable(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteTable(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    return this.tableService.deleteTable(id, user);
  }
}
