import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class DeleteAiMemoryItemDto {
  @IsNotEmpty()
  @IsEnum([
    'allergy',
    'dislike',
    'persona',
    'specialNotes',
    'cuisine',
    'feedback',
    'all',
  ])
  type:
    | 'allergy'
    | 'dislike'
    | 'persona'
    | 'specialNotes'
    | 'cuisine'
    | 'feedback'
    | 'all';

  @IsOptional()
  value?: string | number;
}
