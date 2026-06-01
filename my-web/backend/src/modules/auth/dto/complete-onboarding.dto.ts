// Mục đích: Định nghĩa DTO cho việc hoàn thiện hồ sơ đa chi nhánh (Onboarding) của cả hai vai trò: Khách hàng (Customer) và Đối tác nhà hàng (Restaurant/Merchant).
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AuthController.completeOnboarding() và AuthService.completeOnboarding().
// Chức năng đặc biệt: Xác thực cấu trúc lồng nhau (Nested Validation) của danh sách các chi nhánh nhà hàng (RestaurantBranchDto) bao gồm kiểm tra tính hợp lệ của tọa độ địa lý (latitude, longitude).
// Kiến thức/Design Pattern: DTO Pattern, Nested Validation, Separation of Concerns, Type Safety.
// Các biến, hàm đặc biệt: RestaurantBranchDto, CompleteOnboardingDto.

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
