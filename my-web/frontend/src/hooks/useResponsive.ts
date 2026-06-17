// Mục đích file này để làm gì: Custom hook theo dõi và cung cấp các breakpoints (Mobile, Tablet, Desktop) tối ưu cho giao diện.
// Các file khác hay file này có ý nghĩa như nào: Cung cấp trạng thái kích thước màn hình toàn cục để các component con tùy chỉnh hành vi hoặc phong cách hiển thị.
// Các chức năng đặc biệt: Tối ưu hóa tối đa bằng cách sử dụng matchMedia thay vì resize, an toàn với Next.js SSR (Hydration Mismatch safety).
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Separation of Concerns (SoC), Performance Optimization, SSR-friendly design.
// Các biến, hàm đặc biệt trong file: useResponsive (custom hook), updateBreakpoints (hàm cập nhật trạng thái).
'use client';

import { useState, useEffect } from 'react';

export interface ScreenSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useResponsive(): ScreenSize {
  // Trạng thái mặc định an toàn cho Server-Side Rendering (SSR)
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Khởi tạo các truy vấn Media Query tương ứng với breakpoints của Tailwind CSS
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    // Hàm cập nhật trạng thái khi khớp truy vấn
    const updateBreakpoints = () => {
      setScreenSize({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    // Khởi chạy ngay sau khi component mount ở phía client
    updateBreakpoints();

    // Lắng nghe sự thay đổi trạng thái (chỉ kích hoạt khi màn hình vượt qua ranh giới breakpoint)
    // Dùng addEventListener/removeEventListener tương thích rộng rãi
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', updateBreakpoints);
      tabletQuery.addEventListener('change', updateBreakpoints);
      desktopQuery.addEventListener('change', updateBreakpoints);
    } else {
      // Hỗ trợ dự phòng cho các trình duyệt cũ hơn sử dụng addListener
      mobileQuery.addListener(updateBreakpoints);
      tabletQuery.addListener(updateBreakpoints);
      desktopQuery.addListener(updateBreakpoints);
    }

    return () => {
      if (typeof mobileQuery.removeEventListener === 'function') {
        mobileQuery.removeEventListener('change', updateBreakpoints);
        tabletQuery.removeEventListener('change', updateBreakpoints);
        desktopQuery.removeEventListener('change', updateBreakpoints);
      } else {
        mobileQuery.removeListener(updateBreakpoints);
        tabletQuery.removeListener(updateBreakpoints);
        desktopQuery.removeListener(updateBreakpoints);
      }
    };
  }, []);

  return screenSize;
}
