import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsNotEmpty()
  description: string = '';

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pointsCost: number = 0;

  @IsString()
  @IsNotEmpty()
  discountValue: string = '';

  @IsString()
  @IsNotEmpty()
  minSpend: string = '';

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  expiryDays: number = 1;

  @IsString()
  @IsOptional()
  expiryDate?: string = '';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  quantity?: number = 100;

  @IsString()
  @IsOptional()
  image?: string = '';

  @IsString()
  @IsNotEmpty()
  promoType: string = 'DISCOUNT';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  restaurantId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  applicableRestaurantIds?: number[];
}
