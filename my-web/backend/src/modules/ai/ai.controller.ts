// Mục đích: Định nghĩa các API cửa ngõ của module AI tư vấn ẩm thực (trò chuyện với chatbot, lấy lịch sử ngữ cảnh, và xóa lịch sử ngữ cảnh).
// File quan hệ: Nhận request từ Client, xác thực người dùng qua JwtAuthGuard và gọi AiService để thực hiện các yêu cầu AI.
// Chức năng đặc biệt: Tích hợp định vị địa lý (vĩ độ, kinh độ, thành phố, quận) vào tin nhắn chat để cá nhân hóa việc tư vấn món ăn/nhà hàng xung quanh.
// Kiến thức/Design Pattern: Single Responsibility (chỉ routing và xác thực đầu vào), Dependency Injection, Guard Pattern.
// Các biến, hàm đặc biệt: chat(), getContext(), clearContext().

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
    return this.aiService.chat(
      userId,
      dto.message,
      dto.lat,
      dto.lng,
      dto.city,
      dto.district,
    );
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
