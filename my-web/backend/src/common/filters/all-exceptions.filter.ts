// Mục đích: Lọc và gom toàn bộ các lỗi (Exception) văng ra trong ứng dụng.
// Ý nghĩa: Đảm bảo mọi lỗi đều được trả về client dưới cùng một format JSON thống nhất, tránh rò rỉ mã lỗi hệ thống.
// Chức năng đặc biệt: Nhận diện lỗi từ HttpException hoặc Error thường để trích xuất thông báo lỗi phù hợp.
// Kiến thức/Design Pattern: Exception Filter Pattern, Dependency Inversion (cung cấp lớp middleware xử lý).
// Biến/hàm đặc biệt: Hàm catch() chuyển đổi context sang HTTP và ép kiểu Response/Request của Express.
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

import { HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { MESSAGES } from '../constants/messages.constant';
import { ErrorCodes } from '../constants/error-codes.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR as string;

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string | string[]) || exception.message;
        errorCode = (body.error as string) || 'BAD_REQUEST';
      } else {
        message = responseBody;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errors = Array.isArray(message)
      ? message.map((msg) => ({ code: errorCode, message: msg }))
      : [{ code: errorCode, message: message }];

    response.status(status).json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: status,
      },
      errors,
    });
  }
}
