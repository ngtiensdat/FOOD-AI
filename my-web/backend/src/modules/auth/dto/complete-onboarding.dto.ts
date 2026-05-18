import {
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RestaurantBranchDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  openingHours?: string;
}

export class CompleteOnboardingDto {
  // Dành cho Customer
  @IsObject()
  @IsOptional()
  preferences?: Record<string, unknown>;

  // Dành cho Restaurant (Nhận danh sách nhiều chi nhánh)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantBranchDto)
  @IsOptional()
  branches?: RestaurantBranchDto[];
}
