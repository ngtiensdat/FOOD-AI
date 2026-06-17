// Mục đích: Định nghĩa DTO cho việc đăng nhập tài khoản của người dùng, xác thực tính hợp lệ của email và mật khẩu.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AuthController.login() và AuthService.login().
// Chức năng đặc biệt: Tự động kiểm tra định dạng email và mật khẩu không rỗng với các thông điệp lỗi tùy chỉnh bằng tiếng Việt.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern (class-validator), Separation of Concerns.
// Các biến, hàm đặc biệt: email, password.

import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class LoginDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;

  @IsString()
  @IsNotEmpty({ message: () => MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  password: string;
}
