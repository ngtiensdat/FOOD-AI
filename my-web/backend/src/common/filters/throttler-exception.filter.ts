import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.TOO_MANY_REQUESTS;

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
          message: 'Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
        },
      ],
    });
  }
}
