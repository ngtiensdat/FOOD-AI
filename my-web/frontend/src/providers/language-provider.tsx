// Mục đích file này để làm gì: Component Provider đồng bộ ngôn ngữ hiển thị giữa Client và Server.
// Các file khác hay file này có ý nghĩa như nào: Gói ở gốc ứng dụng (layout.tsx), quản lý và đồng bộ cookie 'lang' với localStorage để tránh Hydration Mismatch.
// Các chức năng đặc biệt: Thiết lập ngôn ngữ đồng bộ trong render phase và kiểm tra đồng bộ trong useEffect để tải lại trang nếu trạng thái lưu trữ khác biệt.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Context Sync, React Lifecycle Hooks, Cookie-LocalStorage Synchronization.
// Các biến, hàm đặc biệt trong file: LanguageProvider component.
'use client';

import React from 'react';
import { setLanguageForRequest } from '@/constants/labels';

interface LanguageProviderProps {
  children: React.ReactNode;
  lang: string;
}

export const LanguageProvider = ({ children, lang }: LanguageProviderProps) => {
  // Set the language synchronously during rendering to ensure SSR and hydration match
  setLanguageForRequest(lang);

  React.useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (!savedLang) {
      localStorage.setItem('lang', lang);
    } else if (savedLang !== lang) {
      document.cookie = `lang=${savedLang}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  }, [lang]);

  return <>{children}</>;
};
