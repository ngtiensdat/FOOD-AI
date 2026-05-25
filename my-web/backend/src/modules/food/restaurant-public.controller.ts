import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '../../common/guards/jwt-auth-optional.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';

@Controller('restaurants')
export class RestaurantPublicController {
  constructor(private readonly foodService: FoodService) {}

  @Get(':id/public')
  @UseGuards(JwtAuthOptionalGuard)
  getPublicRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getPublicRestaurant(id, user || undefined);
  }

  @Get(':id/foods')
  @UseGuards(JwtAuthOptionalGuard)
  getPublicRestaurantFoods(
    @Param('id', ParseIntPipe) id: number,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
  ) {
    return this.foodService.getPublicRestaurantFoods(
      id,
      categoryId ? parseInt(categoryId, 10) : undefined,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get(':id/followers')
  @UseGuards(JwtAuthOptionalGuard)
  getRestaurantFollowers(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getRestaurantFollowers(id, user || undefined);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthOptionalGuard)
  getMerchantFollowing(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User | null,
  ) {
    return this.foodService.getMerchantFollowing(id, user || undefined);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  toggleFollow(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PrismaClient.User,
  ) {
    return this.foodService.toggleFollowRestaurant(user.id, id);
  }
}
