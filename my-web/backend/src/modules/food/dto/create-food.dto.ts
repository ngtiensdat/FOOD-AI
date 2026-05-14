import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFoodDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  restaurantId?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lng?: number;
}
