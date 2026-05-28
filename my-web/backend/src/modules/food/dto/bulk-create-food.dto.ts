// Mục đích: Định nghĩa DTO cho việc tạo mới các món ăn hàng loạt (Bulk Create) trong thực đơn của một nhà hàng cụ thể.
// File quan hệ: Nhập danh sách DTO của món ăn (CreateFoodDto) và được dùng trong FoodController.createBulkFood() cùng FoodService.createBulk().
// Chức năng đặc biệt: Xác thực ID nhà hàng là số nguyên không rỗng, kiểm tra cấu trúc mảng món ăn lồng nhau (ValidateNested) qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Nested Validation, Separation of Concerns.
// Các biến, hàm đặc biệt: BulkCreateFoodDto.

import { IsArray, ValidateNested, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFoodDto } from './create-food.dto';
import { MESSAGES } from '../../../common/constants/messages.constant';

export class BulkCreateFoodDto {
  @IsInt()
  @IsNotEmpty({ message: MESSAGES.FOOD.RESTAURANT_REQUIRED })
  @Type(() => Number)
  restaurantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodDto)
  foods: CreateFoodDto[];
}
