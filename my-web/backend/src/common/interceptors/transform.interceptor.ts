// Mục đích: Chặn (Intercept) mọi response trước khi trả về cho client để định dạng lại chuẩn.
// Ý nghĩa: Đảm bảo mọi API (dù trả về obj hay mảng) đều được bọc trong { success, data, meta }.
// Chức năng đặc biệt: Tự động phân tích và tạo wrapper response nếu dữ liệu chưa có format.
// Kiến thức/Design Pattern: Interceptor Pattern, Middleware/Pipe, RxJS (map). Tuân thủ Open/Closed Principle (SOLID).
// Biến/hàm đặc biệt: Hàm intercept() dùng toán tử map của rxjs để mutate luồng dữ liệu trả về.
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T): Response<T> => {
        // Nếu data đã có cấu trúc data/meta thì giữ nguyên
        if (data && typeof data === 'object' && 'data' in data) {
          const wrapper = data as unknown as Response<T>;
          return {
            success: true,
            data: wrapper.data,
            meta: wrapper.meta || {},
          };
        }

        // Nếu data là một mảng, chúng ta mặc định meta rỗng hoặc có thể bổ sung logic pagination sau
        return {
          success: true,
          data: data,
          meta: {},
        };
      }),
    );
  }
}
