import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

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

    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

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
