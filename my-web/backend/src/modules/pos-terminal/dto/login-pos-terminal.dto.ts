import { IsString } from 'class-validator';

export class LoginPosTerminalDto {
  @IsString()
  code: string;

  @IsString()
  password: string;
}
