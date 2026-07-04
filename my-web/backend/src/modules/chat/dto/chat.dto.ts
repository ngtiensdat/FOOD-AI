import { IsNotEmpty, IsString, IsInt, IsArray } from 'class-validator';

export class CreateDirectChatDto {
  @IsInt()
  @IsNotEmpty()
  recipientId: number;
}

export class CreateGroupChatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  participantIds: number[];
}

export class SendDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
