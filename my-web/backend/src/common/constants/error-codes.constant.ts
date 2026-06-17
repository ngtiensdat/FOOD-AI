// Mục đích: Định nghĩa tập hợp các mã lỗi chuẩn (Error Codes) của hệ thống.
// Ý nghĩa: Giúp Frontend nhận diện chính xác loại lỗi dựa trên mã code (string) thay vì dựa vào mã HTTP status hoặc message thay đổi theo ngôn ngữ.
// Chức năng đặc biệt: Enum ErrorCodes tập trung toàn bộ mã lỗi.
// Kiến thức/Design Pattern: Enum Pattern, Magic String Avoidance.
// Biến/hàm đặc biệt: Enum ErrorCodes (USER_ALREADY_EXISTS, INVALID_CREDENTIALS...).
export enum ErrorCodes {
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}
