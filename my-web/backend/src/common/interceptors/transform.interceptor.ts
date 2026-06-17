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
