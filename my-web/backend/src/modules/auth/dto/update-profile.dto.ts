// Mục đích: Định nghĩa DTO cho việc cập nhật thông tin hồ sơ người dùng (Customer, Restaurant/Merchant, Admin).
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong các API cập nhật hồ sơ người dùng.
// Chức năng đặc biệt: Cho phép cập nhật tùy chọn tất cả các trường thông tin cá nhân của người dùng, tự động xác thực qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: name, fullName, phone, avatar, coverImage, bio, address, workAt, preferences.

import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  Matches,
} from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: () => MESSAGES.VALIDATION.NAME_MIN_LENGTH })
  @Matches(/^[^0-9]*$/, { message: () => MESSAGES.VALIDATION.NAME_INVALID })
  name?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  workAt?: string;

  @IsOptional()
  preferences?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  syncWithRestaurantLogo?: boolean;

  @IsBoolean()
  @IsOptional()
  syncWithRestaurantCover?: boolean;
}
