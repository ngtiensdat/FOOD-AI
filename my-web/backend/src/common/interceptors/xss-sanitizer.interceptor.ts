import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class XssSanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest();

    // Chỉ tự động sanitize body cho các method thay đổi trạng thái
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      request.body = this.sanitize(request.body);
    }

    return next.handle();
  }

  private sanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Lọc sạch các thẻ script, iframe, onload attributes... gây mã độc XSS
      return DOMPurify.sanitize(obj).trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (typeof obj === 'object') {
      // Đối với các kiểu đối tượng phức tạp (ví dụ: file uploads, buffer), không đệ quy sâu
      if (
        obj instanceof Buffer ||
        (obj.constructor?.name === 'Object') === false
      ) {
        return obj;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj[key] = this.sanitize(obj[key]);
        }
      }
    }

    return obj;
  }
}
