// Mục đích: Bắt các lỗi do hệ thống giới hạn tần suất (Rate Limiting/Throttler) ném ra.
// Ý nghĩa: Format lại lỗi 429 Too Many Requests theo cấu trúc JSON chuẩn của toàn dự án thay vì text/html mặc định.
// Chức năng đặc biệt: Trích xuất thông báo lỗi động từ exception để thông báo chi tiết cho người dùng.
// Kiến thức/Design Pattern: Exception Filter Pattern, OCP (Mở rộng khả năng xử lý lỗi mà không sửa core).
// Biến/hàm đặc biệt: @Catch(ThrottlerException) để chỉ bắt đúng loại lỗi này.
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { MESSAGES } from '../constants/messages.constant';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.TOO_MANY_REQUESTS;

    // Lấy thông điệp lỗi động từ Exception được ném ra
    const exceptionResponse = exception.getResponse() as
      | string
      | Record<string, unknown>;
    const customMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse?.message as string | undefined) ||
          exception.message;

    response.status(status).json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: status,
      },
      errors: [
        {
          code: 'TOO_MANY_REQUESTS',
          message: customMessage || MESSAGES.AUTH.RATE_LIMIT_LOGIN,
        },
      ],
    });
  }
}
