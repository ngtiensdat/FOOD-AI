import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from '../../food/dto/create-food.dto';

export class AdminUpdateFoodDto extends PartialType(CreateFoodDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeaturedToday?: boolean;

  @IsBoolean()
  @IsOptional()
  isAdminRecommended?: boolean;
}
