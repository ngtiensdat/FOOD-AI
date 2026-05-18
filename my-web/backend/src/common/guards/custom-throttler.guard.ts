import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import {
  Injectable,
  HttpException,
  HttpStatus,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getTracker(req: Record<string, any>): Promise<string> {
    await Promise.resolve();
    const request = req as unknown as import('express').Request;
    const body = request.body as Record<string, unknown> | undefined;
    // Nếu là request đăng nhập và có email, dùng email làm định danh (tracker)
    if (body && typeof body.email === 'string') {
      return `login_limit_${body.email}`;
    }
    // Nếu không, quay về dùng IP mặc định
    return request.ip || '';
  }

  protected async throwThrottlerException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    await Promise.resolve();
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          'Tài khoản này đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
