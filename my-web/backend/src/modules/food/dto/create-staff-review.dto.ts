import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffReviewDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
