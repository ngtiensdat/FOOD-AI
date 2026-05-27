// Mục đích: Định nghĩa DTO cho việc cập nhật thông tin món ăn (Food) trong thực đơn của nhà hàng.
// File quan hệ: Kế thừa CreateFoodDto và được sử dụng làm kiểu dữ liệu đầu vào trong FoodController.updateFood() và FoodService.updateFood().
// Chức năng đặc biệt: Tự động chuyển đổi các trường của CreateFoodDto thành tùy chọn (Optional) thông qua PartialType.
// Kiến thức/Design Pattern: DTO Pattern, Inheritance, Separation of Concerns.
// Các biến, hàm đặc biệt: Class UpdateFoodDto.

import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from './create-food.dto';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
