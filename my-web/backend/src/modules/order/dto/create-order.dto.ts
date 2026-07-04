import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsNumber()
  foodId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @IsNumber()
  restaurantId: number;

  @IsNumber()
  @IsOptional()
  tableId?: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  total: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
