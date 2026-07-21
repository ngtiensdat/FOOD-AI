/**
 * Mục đích file này: Định nghĩa Controller tiếp nhận các HTTP requests RESTful API cho đối tượng Khuyến mãi (Offer).
 * Các file khác hay file này có ý nghĩa như nào: Nhận DTO đầu vào, chuyển tiếp cho OfferService xử lý nghiệp vụ và bảo vệ bằng RolesGuard / JwtAuthGuard.
 * Các chức năng đặc biệt: approveOffer, rejectOffer (phê duyệt khuyến mãi tự nhập cho Admin), createOffer/updateOffer/deleteOffer.
 */
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
import { OfferService } from './offer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller('offers')
export class OfferController {
  constructor(private offerService: OfferService) {}

  @Get()
  async getAllOffers(
    @Query('promoType') promoType?: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
  ) {
    const restId = restaurantId ? parseInt(restaurantId, 10) : undefined;
    return this.offerService.getAllOffers(promoType, restId, status);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveOffer(@Param('id', ParseIntPipe) offerId: number) {
    return this.offerService.approveOffer(offerId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectOffer(@Param('id', ParseIntPipe) offerId: number) {
    return this.offerService.rejectOffer(offerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createOffer(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offerService.createOffer(userId, role, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateOffer(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Param('id', ParseIntPipe) offerId: number,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offerService.updateOffer(userId, role, offerId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteOffer(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Param('id', ParseIntPipe) offerId: number,
  ) {
    return this.offerService.deleteOffer(userId, role, offerId);
  }
}
