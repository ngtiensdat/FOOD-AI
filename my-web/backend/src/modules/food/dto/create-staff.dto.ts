import {
  IsString,
  IsEmail,
  MinLength,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Type(() => Number)
  restaurantId: number;
}
