// Mục đích: Định nghĩa DTO cho việc đăng ký tài khoản người dùng mới (bao gồm khách hàng và đối tác thương gia).
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AuthController.register() và AuthService.register().
// Chức năng đặc biệt: Xác thực định dạng email, độ dài mật khẩu (tối thiểu 8 ký tự), kiểm tra vai trò người dùng thuộc UserRole enum (Prisma) và tài liệu pháp lý tùy chọn cho nhà hàng.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: email, password, name, role, legalDocuments.

import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class RegisterDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;

  @IsString()
  @IsNotEmpty({ message: () => MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  @MinLength(8, { message: () => MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH })
  password: string;

  @IsString()
  @IsNotEmpty({ message: () => MESSAGES.VALIDATION.NAME_REQUIRED })
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  legalDocuments?: string;
}
