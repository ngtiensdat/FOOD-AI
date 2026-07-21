import { IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreatePosTerminalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  code: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsNumber()
  restaurantId: number;
}
