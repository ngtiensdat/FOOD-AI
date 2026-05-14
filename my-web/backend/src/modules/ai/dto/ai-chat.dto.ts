import { IsString, IsNumber, IsOptional } from 'class-validator';

export class AiChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
