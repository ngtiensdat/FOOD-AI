import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GeneratePointCodeDto, ClaimPointCodeDto } from './dto/point-code.dto';

@Controller('vouchers')
export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  @Get()
  async getAllVouchers(@Query('restaurantId') restaurantId?: string) {
    const rId = restaurantId ? Number(restaurantId) : undefined;
    return this.voucherService.getAllVouchers(rId);
  }

  @Get('my-vouchers')
  @UseGuards(JwtAuthGuard)
  async getMyVouchers(@GetUser('id') userId: number) {
    return this.voucherService.getMyVouchers(userId);
  }

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  async redeemVoucher(
    @GetUser('id') userId: number,
    @Param('id') voucherId: string,
  ) {
    return this.voucherService.redeemVoucher(userId, voucherId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createVoucher(
    @GetUser('id') userId: number,
    @GetUser('role') role: string,
    @Body() dto: CreateVoucherDto,
  ) {
    return this.voucherService.createVoucher(userId, role, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateVoucher(
    @GetUser('id') userId: number,
    @GetUser('role') role: string,
    @Param('id') voucherId: string,
    @Body() dto: UpdateVoucherDto,
  ) {
    return this.voucherService.updateVoucher(userId, role, voucherId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteVoucher(
    @GetUser('id') userId: number,
    @GetUser('role') role: string,
    @Param('id') voucherId: string,
  ) {
    return this.voucherService.deleteVoucher(userId, role, voucherId);
  }

  @Post('point-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async generatePointCode(
    @GetUser('id') userId: number,
    @Body() dto: GeneratePointCodeDto,
  ) {
    return this.voucherService.generatePointCode(userId, dto);
  }

  @Get('point-codes/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async getPointCodesLogs(@GetUser('id') userId: number) {
    return this.voucherService.getPointCodesLogs(userId);
  }

  @Post('point-codes/claim')
  @UseGuards(JwtAuthGuard)
  async claimPointCode(
    @GetUser('id') userId: number,
    @Body() dto: ClaimPointCodeDto,
  ) {
    return this.voucherService.claimPointCode(userId, dto);
  }

  @Delete('my-vouchers/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUserVoucher(
    @GetUser('id') userId: number,
    @Param('id') userVoucherId: string,
  ) {
    return this.voucherService.deleteUserVoucher(userId, userVoucherId);
  }

  @Get('merchant/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async verifyVoucherCode(
    @GetUser('id') userId: number,
    @Query('code') code: string,
  ) {
    return this.voucherService.verifyVoucherCode(userId, code);
  }

  @Post('merchant/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async useVoucherCode(
    @GetUser('id') userId: number,
    @Body('code') code: string,
  ) {
    return this.voucherService.useVoucherCode(userId, code);
  }
}
