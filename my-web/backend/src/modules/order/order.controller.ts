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
import { PayosService } from './payos.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly payosService: PayosService,
  ) {}

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

  @Post('payment-link')
  createPaymentLink(
    @Body('amount') amount: number,
    @Body('description') description: string,
  ) {
    // PayOS requires orderCode to be a 32-bit signed integer (max 2,147,483,647)
    // Date.now() is 13 digits and will overflow on PayOS, causing mismatch.
    const orderCode = Math.floor(Date.now() % 2147483647);
    return this.payosService.createPaymentLink(orderCode, amount, description);
  }

  @Get('payment-link/:orderCode')
  getPaymentLinkInfo(@Param('orderCode', ParseIntPipe) orderCode: number) {
    return this.payosService.getPaymentLinkInformation(orderCode);
  }
}
