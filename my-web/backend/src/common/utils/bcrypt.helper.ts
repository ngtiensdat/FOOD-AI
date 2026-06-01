// Mục đích: Cung cấp tiện ích (Utility) để băm (hash) và kiểm tra mật khẩu.
// Ý nghĩa: Gom nhóm logic xử lý mật khẩu vào một nơi để dễ dàng tái sử dụng và thay thế thư viện nếu cần.
// Chức năng đặc biệt: Sử dụng bcrypt để mã hóa một chiều (1-way encryption).
// Kiến thức/Design Pattern: Utility Class/Facade Pattern (bọc thư viện bên thứ 3).
// Biến/hàm đặc biệt: Hàm hash() băm mật khẩu với saltRounds=10, hàm compare() kiểm tra khớp.
import * as bcrypt from 'bcrypt';

export class BcryptHelper {
  static async hash(plainText: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(plainText, saltRounds);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
