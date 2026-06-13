import {
  Controller,
  Get,
  Post,
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

@Controller('offers')
export class OfferController {
  constructor(private offerService: OfferService) {}

  @Get()
  async getAllOffers(@Query('promoType') promoType?: string) {
    return this.offerService.getAllOffers(promoType);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async createOffer(
    @GetUser('id') userId: number,
    @Body()
    dto: {
      title: string;
      description: string;
      promoType: string;
      discountValue: string;
      restaurantName: string;
      restaurantId?: number;
      image: string;
      validUntil: string;
    },
  ) {
    return this.offerService.createOffer(userId, dto);
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
