import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdatePosTerminalDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
