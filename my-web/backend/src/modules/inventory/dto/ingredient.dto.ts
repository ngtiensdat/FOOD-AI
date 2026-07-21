import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;
}

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;
}

export class ImportIngredientDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
