import { Controller, Post, Body, Get, Delete, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body()
    body: {
      userId: number;
      message: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return this.aiService.chat(body.userId, body.message, body.lat, body.lng);
  }

  @Get('context')
  async getContext(@Query('userId') userId: string) {
    return this.aiService.getChatContext(parseInt(userId));
  }

  @Delete('context')
  async clearContext(@Body() body: { userId: number }) {
    return this.aiService.clearChatContext(body.userId);
  }
}
