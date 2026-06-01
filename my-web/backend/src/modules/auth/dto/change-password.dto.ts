// Mục đích: Định nghĩa DTO cho việc thay đổi mật khẩu của người dùng, kiểm định độ dài và tính hợp lệ của mật khẩu cũ và mới.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AuthController.changePassword() và AuthService.changePassword().
// Chức năng đặc biệt: Tự động kiểm duyệt độ dài tối thiểu của mật khẩu mới bằng các thông điệp lỗi tùy chỉnh bằng tiếng Việt.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern (class-validator).
// Các biến, hàm đặc biệt: oldPassword, newPassword.

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  newPassword: string;
}
