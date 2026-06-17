// Mục đích: Cung cấp các Data Transfer Object (DTO) dùng chung cho toàn bộ dự án.
// Ý nghĩa: Đảm bảo format request (phân trang) và response (trả kết quả) luôn đồng nhất giữa các API.
// Chức năng đặc biệt: Bọc dữ liệu (Wrapper) để gửi về cho client thông qua ApiResponseDto.
// Kiến thức/Design Pattern: Data Transfer Object (DTO) pattern, Generic Types trong TypeScript.
// Biến/hàm đặc biệt: PaginationDto (page, limit) và ApiResponseDto chứa cấu trúc chung.
export class PaginationDto {
  page?: number;
  limit?: number;
}

export class ApiResponseDto<T> {
  statusCode: number;
  message: string;
  data?: T;
}
