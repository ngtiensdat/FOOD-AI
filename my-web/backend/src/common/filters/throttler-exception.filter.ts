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
