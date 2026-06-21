// Mục đích: Định nghĩa DTO cho việc thay đổi mật khẩu của người dùng, kiểm định độ dài và tính hợp lệ của mật khẩu cũ và mới.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AuthController.changePassword() và AuthService.changePassword().
// Chức năng đặc biệt: Tự động kiểm duyệt độ dài tối thiểu của mật khẩu mới bằng các thông điệp lỗi tùy chỉnh bằng tiếng Việt.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern (class-validator).
// Các biến, hàm đặc biệt: oldPassword, newPassword.

import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: () => MESSAGES.VALIDATION.OLD_PASSWORD_REQUIRED })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: () => MESSAGES.VALIDATION.NEW_PASSWORD_REQUIRED })
  @MinLength(8, { message: () => MESSAGES.VALIDATION.NEW_PASSWORD_MIN_LENGTH })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: () => MESSAGES.VALIDATION.PASSWORD_INVALID,
  })
  newPassword: string;
}
