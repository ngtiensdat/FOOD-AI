import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Injectable, HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Nếu là request đăng nhập và có email, dùng email làm định danh (tracker)
    if (req.body && req.body.email) {
      return `login_limit_${req.body.email}`;
    }
    // Nếu không, quay về dùng IP mặc định
    return req.ip;
  }

  protected async throwThrottlerException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Tài khoản này đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
