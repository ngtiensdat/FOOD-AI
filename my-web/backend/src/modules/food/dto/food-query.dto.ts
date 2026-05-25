import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LIMITS } from '../../../common/constants/limits.constant';

export class FoodQueryDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number = LIMITS.DEFAULT_NEARBY_RADIUS;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
