// Mục đích: Định nghĩa Custom Decorator @InvalidateCache để đánh dấu các phương thức cần xóa cache sau khi hoàn thành.
// Ý nghĩa: Kết hợp với Interceptor để tự động xóa các key cache theo pattern (ví dụ: "foods:*") khi gọi các tác vụ ghi (create, update, delete).

import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATE_METADATA_KEY = 'cache_invalidate_pattern';

export const InvalidateCache = (pattern: string) =>
  SetMetadata(CACHE_INVALIDATE_METADATA_KEY, pattern);
