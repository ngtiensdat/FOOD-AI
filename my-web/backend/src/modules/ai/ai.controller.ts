// Mục đích file này để làm gì: Định nghĩa các API cửa ngõ của module AI tư vấn ẩm thực (trò chuyện với chatbot, lấy lịch sử ngữ cảnh, và xóa lịch sử ngữ cảnh).
// Các file khác hay file này có ý nghĩa như nào: Nhận request từ Client, xác thực người dùng qua JwtAuthGuard và gọi AiService để thực hiện các yêu cầu AI.
// Các chức năng đặc biệt: Tích hợp định vị địa lý (vĩ độ, kinh độ, thành phố, quận) vào tin nhắn chat để cá nhân hóa việc tư vấn món ăn/nhà hàng xung quanh.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility, Dependency Injection, Guard Pattern.
// Các biến, hàm đặc biệt trong file: chat(), getContext(), clearContext().

import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AiChatDto } from './dto/ai-chat.dto';
import { Throttle } from '@nestjs/throttler';
import { AiFeedbackDto } from './dto/ai-feedback.dto';
import { AiLearningService } from './services/ai-learning.service';
import { WeatherService } from './services/weather.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { CustomThrottlerGuard } from '../../common/guards/custom-throttler.guard';

@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiLearningService: AiLearningService,
    private readonly weatherService: WeatherService,
  ) {}

  @Get('weather')
  async getWeather(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const latitude = lat ? parseFloat(lat) : 10.823;
    const longitude = lng ? parseFloat(lng) : 106.6296;
    return this.weatherService.getCurrentWeather(latitude, longitude);
  }

  @Get('feedback')
  async getFeedbacks(@GetUser('id') userId: number) {
    return this.aiLearningService.getUserFeedbacks(userId);
  }

  @Delete('feedback')
  async clearFeedbacks(@GetUser('id') userId: number) {
    await this.aiLearningService.clearUserFeedbacks(userId);
    return { success: true };
  }

  @Post('feedback')
  async submitFeedback(
    @GetUser('id') userId: number,
    @Body() dto: AiFeedbackDto,
  ) {
    await this.aiLearningService.saveFeedback(userId, dto);
    return { success: true };
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics() {
    return this.aiLearningService.getFeedbackAnalytics();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CustomThrottlerGuard)
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
      dto.offset,
      dto.currentHour,
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
