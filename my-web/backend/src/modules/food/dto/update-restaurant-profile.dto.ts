// Mục đích: Định nghĩa DTO cho việc cập nhật thông tin hồ sơ của nhà hàng (Tên, ảnh bìa, logo, thông tin liên lạc, giờ mở cửa và đồng bộ hóa hai chiều).
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong RestaurantController.updateRestaurantProfile().
// Chức năng đặc biệt: Xác thực tùy chọn các trường thông tin hồ sơ dạng chuỗi và boolean thông qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: name, address, city, district, description, mapUrl, logo, coverImage, bio, contactEmail, contactPhone, openingHours, syncWithPersonalAvatar, syncWithPersonalCover.

import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRestaurantProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsBoolean()
  @IsOptional()
  syncWithPersonalAvatar?: boolean;

  @IsBoolean()
  @IsOptional()
  syncWithPersonalCover?: boolean;
}
