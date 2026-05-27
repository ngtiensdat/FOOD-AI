// Mục đích: Định nghĩa DTO cho việc cập nhật thông tin món ăn hàng loạt (Batch Update) từ giao diện quản trị Admin.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong AdminController.batchUpdateFoods() và AdminService.batchUpdateFoods().
// Chức năng đặc biệt: Xác thực danh sách các phần tử cần cập nhật, kiểm tra kiểu dữ liệu lồng nhau qua class-validator và class-transformer.
// Kiến thức/Design Pattern: DTO Pattern, Nesting Validation (Xác thực lồng nhau), Separation of Concerns.
// Các biến, hàm đặc biệt: FoodUpdateItem, BatchUpdateFoodDto.

import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FoodUpdateItem {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsBoolean()
  isFeaturedToday?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeaturedWeekly?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdminRecommended?: boolean;
}

export class BatchUpdateFoodDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodUpdateItem)
  updates: FoodUpdateItem[];
}
