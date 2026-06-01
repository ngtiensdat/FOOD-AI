// Mục đích: Định nghĩa DTO cho việc tạo mới và cập nhật thông tin nhóm danh mục món ăn (Category Group) của nhà hàng.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong CategoryGroupController và các service tương ứng.
// Chức năng đặc biệt: Tự động kiểm tra tính hợp lệ của tên nhóm (không trống khi tạo) và thuộc tính thứ tự hiển thị (order) kiểu số qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: CreateCategoryGroupDto, UpdateCategoryGroupDto.

import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCategoryGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateCategoryGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
