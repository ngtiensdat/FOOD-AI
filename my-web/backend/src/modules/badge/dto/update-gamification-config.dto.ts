import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateGamificationConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  pointsPerLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  postReviewPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commentPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  likePoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deductionMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyCommentLimit?: number;
}
