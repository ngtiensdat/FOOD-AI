import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @GetUser() user: User) {
    return this.orderService.createOrder(dto, user);
  }

  @Get('restaurant/:restaurantId')
  getByRestaurant(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @GetUser() user: User,
  ) {
    return this.orderService.getOrdersByRestaurant(restaurantId, user);
  }
}
