import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCategoryGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateCategoryGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
