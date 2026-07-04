import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  restaurantId: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  capacity?: number;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  status?: string; // FREE, OCCUPIED, RESERVED, DIRTY

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  capacity?: number;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  currentGuests?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class BulkCreateTablesDto {
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  fromNumber: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  toNumber: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  capacity: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  restaurantId: number;

  @IsString()
  @IsOptional()
  zone?: string;
}

export class TransferTableDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  fromTableId: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  toTableId: number;
}
