import { IsNumber, Min, IsString, IsNotEmpty, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePointCodeDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  points: number = 0;
}

export class ClaimPointCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Mã tích điểm phải gồm đúng 6 chữ số' })
  code: string = '';
}
