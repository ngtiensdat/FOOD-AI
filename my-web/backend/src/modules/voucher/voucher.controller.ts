import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('vouchers')
export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  @Get()
  async getAllVouchers() {
    return this.voucherService.getAllVouchers();
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
}
