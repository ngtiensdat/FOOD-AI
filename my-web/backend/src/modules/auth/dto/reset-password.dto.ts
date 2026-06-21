import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class ResetPasswordDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  otp: string;

  @IsString()
  @MinLength(8, { message: () => MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH })
  newPassword: string;
}
