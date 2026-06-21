// Mục đích: Định nghĩa DTO cho yêu cầu gửi tin nhắn trò chuyện với chatbot AI, bao gồm thông tin vị trí địa lý tùy chọn để tăng độ chính xác của đề xuất món ăn/nhà hàng.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AiController.chat() và AiService.chat().
// Chức năng đặc biệt: Xác thực dữ liệu đầu vào tin nhắn chat dạng chuỗi không rỗng, tự động ép kiểu tọa độ (latitude, longitude) và địa phương (city, district) tùy chọn qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: message, lat, lng, city, district.

import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class AiChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  isRaining?: boolean;

  @IsOptional()
  @IsNumber()
  conversationId?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}
