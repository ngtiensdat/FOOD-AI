import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderHistoryItemDto {
  @IsNumber()
  foodId: number;

  @IsString()
  foodName: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderHistoryDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  @IsOptional()
  tableId?: number;

  @IsString()
  @IsOptional()
  tableName?: string;

  @IsNumber()
  @IsOptional()
  staffId?: number;

  @IsString()
  @IsOptional()
  staffName?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  total: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderHistoryItemDto)
  items: CreateOrderHistoryItemDto[];
}

export class ClockInDto {
  @IsNumber()
  staffId: number;

  @IsString()
  staffName: string;

  @IsNumber()
  @IsOptional()
  terminalId?: number;

  @IsString()
  @IsOptional()
  terminalName?: string;
}

export class ClockOutDto {
  @IsNumber()
  @IsOptional()
  totalOrders?: number;

  @IsNumber()
  @IsOptional()
  totalRevenue?: number;
}

export class UpsertDailySalesDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Định dạng ngày phải là YYYY-MM-DD',
  })
  date: string;

  @IsNumber()
  @IsOptional()
  totalRevenue?: number;

  @IsNumber()
  @IsOptional()
  totalOrders?: number;

  @IsNumber()
  @IsOptional()
  cancelledOrders?: number;

  @IsNumber()
  @IsOptional()
  cashRevenue?: number;

  @IsNumber()
  @IsOptional()
  transferRevenue?: number;

  @IsNumber()
  @IsOptional()
  totalDiscount?: number;
}
