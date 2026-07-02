import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @IsOptional()
  rating?: number;

  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;

  @IsInt()
  @IsOptional()
  restaurantId?: number;

  @IsInt()
  @IsOptional()
  foodId?: number;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @IsInt()
  @IsOptional()
  sharedFromId?: number;
}
