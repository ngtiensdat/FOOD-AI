// Mục đích: Định nghĩa DTO cho việc cập nhật trạng thái hoạt động (bật/tắt isActive) của nhà hàng.
// File quan hệ: Được sử dụng làm kiểu dữ liệu đầu vào trong RestaurantController.updateRestaurantStatus().
// Chức năng đặc biệt: Xác thực thuộc tính isActive là kiểu boolean bắt buộc thông qua class-validator.
// Kiến thức/Design Pattern: DTO Pattern, Validation Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt: isActive.

import { IsBoolean } from 'class-validator';

export class UpdateRestaurantStatusDto {
  @IsBoolean()
  isActive: boolean;
}
