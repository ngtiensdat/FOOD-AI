// Mục đích: Tạo một Custom Decorator để lấy nhanh thông tin người dùng từ Request.
// Ý nghĩa: Thay vì phải dùng req.user (có thể gây lỗi type), ta dùng @GetUser() trong Controller cho code sạch và an toàn hơn.
// Chức năng đặc biệt: Hỗ trợ lấy toàn bộ object user hoặc lấy một trường cụ thể (vd: @GetUser('id')).
// Kiến thức/Design Pattern: Decorator Pattern, Abstraction.
// Biến/hàm đặc biệt: Hàm createParamDecorator để trích xuất dữ liệu từ ExecutionContext.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload';

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
