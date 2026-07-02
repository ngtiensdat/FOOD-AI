import { IsInt, IsNotEmpty } from 'class-validator';

export class ToggleFollowDto {
  @IsInt()
  @IsNotEmpty()
  followingId: number;
}
