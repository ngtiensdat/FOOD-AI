import { IsEmail } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class ForgotPasswordDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;
}
