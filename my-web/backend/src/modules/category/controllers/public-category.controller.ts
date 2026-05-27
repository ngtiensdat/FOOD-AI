// Mục đích: Định nghĩa API cửa ngõ công khai (public) để lấy cấu trúc cây thư mục (danh mục món ăn và nhóm danh mục) của một nhà hàng cụ thể.
// File quan hệ: Nhận request từ mọi khách truy cập (không cần token), gọi CategoryGroupService để bóc tách cấu trúc dữ liệu của nhà hàng.
// Chức năng đặc biệt: Cung cấp API không cần xác thực (/public/restaurants/:id/categories/hierarchy) hỗ trợ Client hiển thị thực đơn theo cấu trúc tầng bậc của nhà hàng.
// Kiến thức/Design Pattern: Single Responsibility, Public Endpoint Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: getHierarchy().

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CategoryGroupService } from '../services/category-group.service';

@Controller('public/restaurants/:id/categories')
export class PublicCategoryController {
  constructor(private readonly categoryGroupService: CategoryGroupService) {}

  @Get('hierarchy')
  async getHierarchy(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryGroupService.getPublicHierarchy(id);
    return { data };
  }
}
