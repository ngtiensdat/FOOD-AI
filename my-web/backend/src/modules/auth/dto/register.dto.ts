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

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  legalDocuments?: string;
}
