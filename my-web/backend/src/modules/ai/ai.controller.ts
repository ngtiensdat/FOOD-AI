import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AiChatDto } from './dto/ai-chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@GetUser('id') userId: number, @Body() dto: AiChatDto) {
    return this.aiService.chat(userId, dto.message, dto.lat, dto.lng);
  }

  @Get('context')
  async getContext(@GetUser('id') userId: number) {
    return this.aiService.getChatContext(userId);
  }

  @Delete('context')
  async clearContext(@GetUser('id') userId: number) {
    return this.aiService.clearChatContext(userId);
  }
}
