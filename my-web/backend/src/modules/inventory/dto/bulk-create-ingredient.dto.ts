import { IsArray, ValidateNested, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIngredientDto } from './ingredient.dto';

export class BulkCreateIngredientDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  restaurantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];
}
