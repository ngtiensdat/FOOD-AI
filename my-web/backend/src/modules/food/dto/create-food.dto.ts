// Mục đích: Định nghĩa DTO cho việc tạo mới thông tin món ăn (Food) trong thực đơn của một nhà hàng cụ thể.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong FoodController.createFood() và được kế thừa/tương tác bởi các DTO khác.
// Chức năng đặc biệt: Xác thực tên món ăn không rỗng, giá cả và tọa độ (lat, lng) kiểu số, ID cơ sở (restaurantId) là số nguyên bắt buộc thông qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: name, price, description, image, tags, restaurantId, lat, lng, address, mapUrl, categoryId.

import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class CreateFoodDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsNotEmpty({ message: MESSAGES.FOOD.RESTAURANT_REQUIRED })
  @Type(() => Number)
  restaurantId: number;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  calories?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  carbs?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  protein?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fat?: number;
}
