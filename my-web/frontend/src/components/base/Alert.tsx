/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) để hiển thị thông báo (Alert) với các trạng thái màu sắc và icon tương ứng (error, success, info).
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI "thuần" (Dumb Component), chỉ nhận Props (type, children) và hiển thị, không chứa business logic. Tái sử dụng linh hoạt khắp ứng dụng.
 * Các chức năng đặc biệt: Dùng `configs` object để ánh xạ chính xác Tailwind classes, tránh lỗi không compile CSS khi nối chuỗi động.
 * Các biến, hàm đặc biệt trong file: `configs` định nghĩa cấu hình style và icon (`lucide-react`) cho từng loại Alert.
 */
'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Alert = ({ type, children, className = '' }: AlertProps) => {
  const configs = {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-500',
      border: 'border-red-100',
      icon: <AlertCircle size={20} />
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      icon: <CheckCircle2 size={20} />
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      icon: <Info size={20} />
    }
  };

  const config = configs[type];

  return (
    <div className={`${config.bg} ${config.text} ${config.border} p-4 rounded-xl text-sm mb-6 border font-bold flex items-center gap-3 ${className}`}>
      {config.icon}
      {children}
    </div>
  );
};
