import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import { UpdateRestaurantStatusDto } from './dto/update-restaurant-status.dto';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PrismaClient.UserRole.RESTAURANT)
export class RestaurantController {
  constructor(private readonly foodService: FoodService) {}

  @Get('my-restaurant')
  getMyRestaurant(@GetUser() user: PrismaClient.User) {
    return this.foodService.getMyRestaurant(user);
  }

  @Patch('my-restaurant/status')
  updateRestaurantStatus(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateRestaurantStatusDto,
  ) {
    return this.foodService.updateMyRestaurantStatus(user, dto.isActive);
  }

  @Patch('my-restaurant/profile')
  updateRestaurantProfile(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateRestaurantProfileDto,
  ) {
    return this.foodService.updateMyRestaurantProfile(
      user,
      dto.openingHours,
      dto.contactPhone,
    );
  }
}
