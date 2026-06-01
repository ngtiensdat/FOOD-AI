import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LIMITS } from '../../../common/constants/limits.constant';

export class RestaurantNearbyQueryDto {
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
}
