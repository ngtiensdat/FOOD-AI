import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MESSAGES } from '../constants/messages.constant';
import { ErrorCodes } from '../constants/error-codes.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

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
      this.logger.warn(
        `HttpException: [${request.method}] ${request.url} - Status: ${status} - Msg: ${JSON.stringify(message)}`,
      );
    } else {
      // Ghi nhận chi tiết lỗi kèm stack trace trên terminal server phục vụ debug
      this.logger.error(
        `Unhandled Exception: [${request.method}] ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      // Giữ nguyên message mặc định là MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR để bảo mật thông tin DB/hệ thống
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
