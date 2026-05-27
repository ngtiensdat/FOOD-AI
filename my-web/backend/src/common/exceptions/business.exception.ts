// Mục đích: Định nghĩa một loại Exception tùy chỉnh (Custom Exception) cho các lỗi logic nghiệp vụ.
// Ý nghĩa: Giúp hệ thống phân biệt được lỗi hệ thống (Crash/500) và lỗi do logic nghiệp vụ (sai mật khẩu, hết hàng...).
// Chức năng đặc biệt: Kế thừa HttpException của NestJS để trả về Http status code và errorCode cụ thể.
// Kiến thức/Design Pattern: Inheritance (OOP), Custom Exception Handling, Separation of Concerns.
// Biến/hàm đặc biệt: constructor nhận vào message, ErrorCodes và HTTP status code mặc định là BAD_REQUEST.
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCodes,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
      },
      status,
    );
  }
}
