// Mục đích: Kiểm tra quyền hạn (Role-based access control - RBAC) của user sau khi đã đăng nhập.
// Ý nghĩa: Đảm bảo chỉ những user có Role đúng với yêu cầu mới được gọi API (vd: API quản trị chỉ dành cho ADMIN).
// Chức năng đặc biệt: Đọc danh sách các Roles yêu cầu từ Decorator và so sánh với role của user trong Request.
// Kiến thức/Design Pattern: Guard Pattern, Reflection API (sử dụng Reflector để lấy metadata).
// Biến/hàm đặc biệt: Reflector.getAllAndOverride lấy metadata theo ROLES_KEY, hàm canActivate kiểm tra mảng.
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole } }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
