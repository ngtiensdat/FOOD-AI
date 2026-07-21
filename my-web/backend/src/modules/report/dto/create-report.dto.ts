import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsInt()
  @IsNotEmpty()
  targetId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
