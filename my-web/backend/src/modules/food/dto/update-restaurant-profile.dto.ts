import { IsString, IsOptional } from 'class-validator';

export class UpdateRestaurantProfileDto {
  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
