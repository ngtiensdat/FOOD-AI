// Mục đích: Định nghĩa DTO cho yêu cầu gửi phản hồi (Like/Dislike) từ người dùng cho gợi ý món ăn của AI.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AiController.submitFeedback() và AiLearningService.saveFeedback().
// Chức năng đặc biệt: Xác thực dữ liệu đầu vào bao gồm ID cuộc hội thoại, ID món ăn và loại phản hồi (LIKE hoặc DISLIKE).
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern.

import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { FeedbackType } from '@prisma/client';

export class AiFeedbackDto {
  @IsInt()
  @IsNotEmpty()
  conversationId: number;

  @IsInt()
  @IsNotEmpty()
  foodId: number;

  @IsEnum(FeedbackType)
  @IsNotEmpty()
  feedbackType: FeedbackType;
}
