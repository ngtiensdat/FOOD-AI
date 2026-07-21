import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @IsOptional()
  parentId?: number;
}
