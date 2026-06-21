import { IsEmail } from 'class-validator';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class ResendOtpDto {
  @IsEmail({}, { message: () => MESSAGES.VALIDATION.EMAIL_INVALID })
  email: string;
}
