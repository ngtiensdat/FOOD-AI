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

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get('restaurant/:restaurantId')
  getByRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.orderService.getOrdersByRestaurant(restaurantId);
  }
}
