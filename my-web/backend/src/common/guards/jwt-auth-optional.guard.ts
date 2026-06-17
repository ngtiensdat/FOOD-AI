// Mục đích: Bảo vệ các API cho phép cả người dùng đã đăng nhập VÀ khách vãng lai truy cập.
// Ý nghĩa: Giúp API nhận diện user nếu có token, nhưng không báo lỗi 401 Unauthorized nếu không có token.
// Chức năng đặc biệt: Ghi đè hàm handleRequest để trả về user nếu hợp lệ, trả về null nếu không hợp lệ.
// Kiến thức/Design Pattern: Strategy Pattern (AuthGuard('jwt')), Override/Polymorphism (OOP).
// Biến/hàm đặc biệt: Hàm handleRequest bỏ qua các tham số err, info để luôn trả về giá trị (user hoặc null).
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthOptionalGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
  ): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
