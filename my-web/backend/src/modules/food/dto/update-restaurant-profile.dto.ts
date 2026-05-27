// Mục đích: Định nghĩa DTO cho việc cập nhật thông tin hồ sơ của nhà hàng (Giờ mở cửa và số điện thoại liên lạc).
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong RestaurantController.updateRestaurantProfile().
// Chức năng đặc biệt: Xác thực tùy chọn các trường thông tin hồ sơ dạng chuỗi thông qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: openingHours, contactPhone.

import { IsString, IsOptional } from 'class-validator';

export class UpdateRestaurantProfileDto {
  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
