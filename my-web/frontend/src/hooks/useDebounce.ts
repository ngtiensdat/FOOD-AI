// Mục đích: Trì hoãn việc cập nhật giá trị (debounce) nhằm giảm tần suất thực thi các hành động đắt đỏ như gọi API hoặc tìm kiếm.
// Ý nghĩa: Tối ưu hiệu năng ứng dụng, ngăn chặn việc gọi API quá nhiều lần liên tiếp khi người dùng nhập dữ liệu.
// Chức năng đặc biệt: Tự động dọn dẹp (clear) timeout khi component bị hủy hoặc khi giá trị/độ trễ thay đổi.
// Design Pattern: Custom Hook pattern, Debounce mechanism.
// Biến, hàm đặc biệt: useDebounce, debouncedValue, handler.

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
