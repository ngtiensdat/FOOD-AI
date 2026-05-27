// Mục đích: Định nghĩa DTO cho việc tạo mới và cập nhật danh mục món ăn (Category) trong nhà hàng.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong CategoryController và các service tương ứng.
// Chức năng đặc biệt: Xác thực tên danh mục không rỗng khi tạo mới, hỗ trợ phân loại phân cấp (parentId) và chỉ định nhóm danh mục (groupId) kiểu số qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: CreateCategoryDto, UpdateCategoryDto.

import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @IsNotEmpty()
  groupId: number;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsNumber()
  @IsOptional()
  depth?: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsNumber()
  @IsOptional()
  depth?: number;
}
