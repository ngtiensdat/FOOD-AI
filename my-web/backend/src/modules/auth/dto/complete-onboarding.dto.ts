import { IsObject, IsNotEmpty } from 'class-validator';

export class CompleteOnboardingDto {
  @IsObject()
  @IsNotEmpty()
  preferences: Record<string, unknown>;
}
