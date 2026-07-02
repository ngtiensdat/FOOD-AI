import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  promoType: string;

  @IsString()
  @IsNotEmpty()
  discountValue: string;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  restaurantId?: number;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  validUntil: string;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  quantity?: number;
}
