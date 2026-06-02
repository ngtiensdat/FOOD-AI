/**
 * Mục đích file này để làm gì: Định nghĩa các API cửa ngõ của module AI tư vấn ẩm thực (trò chuyện với chatbot, lấy lịch sử ngữ cảnh, và xóa lịch sử ngữ cảnh).
 * Các file khác hay file này có ý nghĩa như nào: Nhận request từ Client, xác thực người dùng qua JwtAuthGuard và gọi AiService để thực hiện các yêu cầu AI.
 * Các chức năng đặc biệt: Tích hợp định vị địa lý (vĩ độ, kinh độ, thành phố, quận) vào tin nhắn chat để cá nhân hóa việc tư vấn món ăn/nhà hàng xung quanh.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility (chỉ routing và xác thực đầu vào), Dependency Injection, Guard Pattern.
 * Các biến, hàm đặc biệt trong file: chat(), getContext(), clearContext().
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AiChatDto } from './dto/ai-chat.dto';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    // eslint-disable-next-line unused-imports/no-unused-vars
    private readonly aiService: AiService,
  ) {}

  @Post('chat')
  async chat(@GetUser('id') userId: number, @Body() dto: AiChatDto) {
    return this.aiService.chat(
      userId,
      dto.message,
      dto.lat,
      dto.lng,
      dto.city,
      dto.district,
      dto.temperature,
      dto.isRaining,
      dto.conversationId,
    );
  }

  @Get('conversations')
  async getConversations(@GetUser('id') userId: number) {
    return this.aiService.getConversations(userId);
  }

  @Post('conversations')
  async createConversation(@GetUser('id') userId: number) {
    return this.aiService.createConversation(userId);
  }

  @Get('conversations/:id')
  async getConversationDetail(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.aiService.getConversationDetail(userId, id);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.aiService.deleteConversation(userId, id);
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
