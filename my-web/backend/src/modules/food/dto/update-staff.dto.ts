import { IsString, IsInt, IsOptional, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStaffDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  restaurantId?: number;

  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
