// Mục đích: Định nghĩa kiểu dữ liệu (Interface) cho Payload của JWT Token.
// Ý nghĩa: Giúp TypeScript nhận diện và tự động gợi ý code (IntelliSense) khi giải mã token.
// Chức năng đặc biệt: Chứa thông tin cơ bản của user (id, sub, email, role) để tái sử dụng mà không cần query DB.
// Kiến thức/Design Pattern: Interface (TypeScript), Stateless Authentication (lưu trữ state ở client).
// Biến/hàm đặc biệt: sub (Subject - định danh chuẩn của JWT).
export interface JwtPayload {
  id?: number;
  sub: string | number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
