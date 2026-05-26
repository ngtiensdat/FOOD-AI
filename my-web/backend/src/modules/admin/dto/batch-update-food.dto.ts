import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FoodUpdateItem {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsBoolean()
  isFeaturedToday?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeaturedWeekly?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdminRecommended?: boolean;
}

export class BatchUpdateFoodDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodUpdateItem)
  updates: FoodUpdateItem[];
}
