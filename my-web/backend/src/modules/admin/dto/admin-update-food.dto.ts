// Mục đích: Định nghĩa DTO (Data Transfer Object) dùng cho việc cập nhật thông tin món ăn từ phía Admin, bao gồm các cấu hình trạng thái hiển thị và khuyến nghị.
// File quan hệ: Kế thừa CreateFoodDto và được sử dụng làm kiểu dữ liệu đầu vào trong AdminController.updateFoodStatus().
// Chức năng đặc biệt: Cho phép cập nhật tùy chọn các trường trạng thái hoạt động, hôm nay nổi bật, và Admin đề xuất; tự động xác thực kiểu dữ liệu qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Inheritance (Kế thừa qua PartialType), Separation of Concerns (Tách biệt dữ liệu đầu vào và logic xử lý).
// Các biến, hàm đặc biệt: isActive, isFeaturedToday, isAdminRecommended.

import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from '../../food/dto/create-food.dto';

export class AdminUpdateFoodDto extends PartialType(CreateFoodDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeaturedToday?: boolean;

  @IsBoolean()
  @IsOptional()
  isAdminRecommended?: boolean;
}
