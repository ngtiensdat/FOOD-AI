// Mục đích: Tùy chỉnh (Override) logic giới hạn tần suất truy cập (Rate Limit) của thư viện Throttler.
// Ý nghĩa: Chống spam (DDoS/Brute force) vào các API nhạy cảm, đồng thời bypass các API bình thường.
// Chức năng đặc biệt: Chỉ áp dụng giới hạn cho API login, register, và AI chat. Định danh user theo email (nếu login).
// Kiến thức/Design Pattern: Decorator Pattern, Inheritance, Template Method Pattern (override các hàm getTracker, throwThrottlingException).
// Biến/hàm đặc biệt: Hàm canActivate() chặn/cho phép các route cụ thể.
import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerException,
} from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { MESSAGES } from '../constants/messages.constant';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Override canActivate to ONLY apply rate limiting on Auth (login/register) and AI routes
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<import('express').Request>();

    // Chỉ áp dụng giới hạn tần suất yêu cầu (rate limit) đối với các router nhạy cảm:
    // 1. Đăng nhập (/auth/login)
    // 2. Đăng ký (/auth/register)
    // 3. AI chat tư vấn (/ai/chat)
    if (
      request.url.includes('/auth/login') ||
      request.url.includes('/auth/register') ||
      request.url.includes('/ai/chat')
    ) {
      return super.canActivate(context);
    }

    // Bỏ qua (bypass) rate limit hoàn toàn đối với các API bình thường khác để tránh lỗi 429
    return true;
  }

  protected override async getTracker(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: Record<string, any>,
  ): Promise<string> {
    await Promise.resolve();
    const request = req as unknown as import('express').Request;
    const body = request.body as Record<string, unknown> | undefined;
    const LOGIN_LIMIT_PREFIX = 'login_limit_';
    // Nếu là request đăng nhập và có email, dùng email làm định danh (tracker)
    if (body && typeof body.email === 'string') {
      return `${LOGIN_LIMIT_PREFIX}${body.email}`;
    }
    // Nếu không, quay về dùng IP mặc định
    return request.ip || '';
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    await Promise.resolve();
    const request = context
      .switchToHttp()
      .getRequest<import('express').Request>();

    const isAi = request.url.includes('/ai/chat');
    const isRegister = request.url.includes('/auth/register');

    let message = MESSAGES.AUTH.RATE_LIMIT_LOGIN;
    if (isAi) {
      message = MESSAGES.AI.RATE_LIMIT_CHAT;
    } else if (isRegister) {
      message = MESSAGES.AUTH.RATE_LIMIT_REGISTER;
    }

    throw new ThrottlerException(message);
  }
}
