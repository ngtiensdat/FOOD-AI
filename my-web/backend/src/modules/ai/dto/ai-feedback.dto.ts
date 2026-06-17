// Mục đích file này để làm gì: Định nghĩa DTO cho yêu cầu gửi phản hồi (Like/Dislike) từ người dùng cho gợi ý món ăn của AI.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng làm kiểu dữ liệu đầu vào trong AiController.submitFeedback() và AiLearningService.saveFeedback().
// Các chức năng đặc biệt: Xác thực dữ liệu đầu vào bao gồm ID cuộc hội thoại, ID món ăn và loại phản hồi (LIKE hoặc DISLIKE) thông qua class-validator.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: DTO Pattern, Validation Decorators (class-validator).
// Các biến, hàm đặc biệt trong file: AiFeedbackDto class.

import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { FeedbackType } from '@prisma/client';

export class AiFeedbackDto {
  @IsInt()
  @IsOptional()
  conversationId?: number;

  @IsInt()
  @IsNotEmpty()
  foodId: number;

  @IsEnum(FeedbackType)
  @IsNotEmpty()
  feedbackType: FeedbackType;
}
