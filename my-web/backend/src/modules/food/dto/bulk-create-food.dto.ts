import { IsArray, ValidateNested, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFoodDto } from './create-food.dto';

export class BulkCreateFoodDto {
  @IsInt()
  @IsNotEmpty({ message: 'Vui lòng chọn cơ sở áp dụng món ăn này.' })
  @Type(() => Number)
  restaurantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodDto)
  foods: CreateFoodDto[];
}
