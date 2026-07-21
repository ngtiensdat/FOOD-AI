import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecipeItemInputDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  usedQuantity: number;
}

export class UpdateRecipeDto {
  @IsNumber()
  @IsNotEmpty()
  foodId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  items: RecipeItemInputDto[];
}
