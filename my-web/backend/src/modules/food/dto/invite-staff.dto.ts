import { IsEmail, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class InviteStaffDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  restaurantId: number;
}
