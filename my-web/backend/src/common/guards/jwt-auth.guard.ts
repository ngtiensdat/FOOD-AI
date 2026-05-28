// Mục đích: Bảo vệ các API bắt buộc phải đăng nhập.
// Ý nghĩa: Đóng vai trò là chốt chặn an ninh, xác thực JWT token từ client gửi lên.
// Chức năng đặc biệt: Kế thừa hoàn toàn AuthGuard('jwt') của Passport mà không cần cấu hình thêm.
// Kiến thức/Design Pattern: Strategy Pattern (sử dụng PassportStrategy), Decorator Pattern.
// Biến/hàm đặc biệt: Kế thừa AuthGuard('jwt') (dùng chuỗi 'jwt' làm identifier cho JwtStrategy).
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
