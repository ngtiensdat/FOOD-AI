import { IsEmail, IsString, Length } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class VerifyEmailDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  otp: string;
}
