import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import {
  CreateOrderHistoryDto,
  ClockInDto,
  ClockOutDto,
  UpsertDailySalesDto,
} from './dto/history.dto';

@Controller('history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  PrismaClient.UserRole.RESTAURANT,
  PrismaClient.UserRole.STAFF,
  PrismaClient.UserRole.ADMIN,
)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  private async resolveId(user: PrismaClient.User, qId?: string) {
    return this.historyService.resolveRestaurantId(user, qId);
  }

  // ── Order History ──────────────────────────────────────────────────────────

  @Get('orders')
  async getOrderHistories(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    // Giới hạn max limit là 100 để tránh tràn bộ nhớ
    const safeLimit = Math.min(Number(limit) || 100, 100);
    return this.historyService.getOrderHistories(
      id,
      safeLimit,
      Number(offset) || 0,
    );
  }

  @Post('orders')
  async createOrderHistory(
    @GetUser() user: PrismaClient.User,
    @Body() dto: CreateOrderHistoryDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    return this.historyService.createOrderHistory(id, dto);
  }

  // ── Staff Shifts ───────────────────────────────────────────────────────────

  @Get('shifts')
  async getStaffShifts(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    const safeLimit = Math.min(Number(limit) || 100, 100);
    return this.historyService.getStaffShifts(
      id,
      safeLimit,
      Number(offset) || 0,
    );
  }

  @Post('shifts/clock-in')
  async clockIn(
    @GetUser() user: PrismaClient.User,
    @Body() dto: ClockInDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    return this.historyService.clockIn(id, dto);
  }

  @Patch('shifts/:id/clock-out')
  async clockOut(
    @GetUser() user: PrismaClient.User,
    @Param('id') shiftId: string,
    @Body() dto: ClockOutDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    return this.historyService.clockOut(shiftId, id, dto);
  }

  // ── Daily Sales ────────────────────────────────────────────────────────────

  @Get('sales')
  async getDailySales(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    return this.historyService.getDailySales(id, from, to);
  }

  @Post('sales/upsert')
  async upsertDailySales(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpsertDailySalesDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const id = await this.resolveId(user, restaurantId);
    const { date, ...data } = dto;
    return this.historyService.upsertDailySales(id, date, data);
  }
}
