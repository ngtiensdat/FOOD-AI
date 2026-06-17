// Mục đích: Định nghĩa DTO cho việc nhận các tham số truy vấn danh sách món ăn từ Client (tìm kiếm theo tag, tìm kiếm theo vị trí lân cận và địa phương).
// File quan hệ: Sử dụng hằng số LIMITS và được dùng làm kiểu dữ liệu của query parameter trong FoodController.getAllFoods() và FoodController.getNearbyFoods().
// Chức năng đặc biệt: Thiết lập bán kính mặc định (radius) từ LIMITS, hỗ trợ tự động ép kiểu tọa độ (lat, lng, radius) sang kiểu số thông qua class-transformer.
// Kiến thức/Design Pattern: DTO Pattern, Query Validation, Separation of Concerns.
// Các biến, hàm đặc biệt: tag, lat, lng, radius, city, district.

import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LIMITS } from '../../../common/constants/limits.constant';

export class FoodQueryDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number = LIMITS.DEFAULT_NEARBY_RADIUS;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
