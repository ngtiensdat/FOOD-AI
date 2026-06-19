import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // 1. Lấy hoặc sinh mới CSRF Token lưu trong Cookie XSRF-TOKEN (httpOnly: false để JS đọc được)
    let csrfToken = request.cookies['XSRF-TOKEN'];
    if (!csrfToken) {
      csrfToken = crypto.randomBytes(32).toString('hex');
      response.cookie('XSRF-TOKEN', csrfToken, {
        path: '/',
        httpOnly: false, // Để client đọc được và Axios/Fetch tự động lấy
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    // 2. Cho phép các phương thức an toàn GET, HEAD, OPTIONS
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // 3. Với các request POST, PUT, PATCH, DELETE -> So khớp token giữa header và cookie
    const clientHeaderToken =
      request.headers['x-xsrf-token'] || request.headers['x-csrf-token'];

    if (!clientHeaderToken || !csrfToken || clientHeaderToken !== csrfToken) {
      throw new ForbiddenException(
        'Yêu cầu bị từ chối do thiếu hoặc sai CSRF token',
      );
    }

    return true;
  }
}
