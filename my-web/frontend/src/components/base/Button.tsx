/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base Component) để hiển thị Nút bấm (Button) tích hợp sẵn hiệu ứng chuyển động (framer-motion).
 * Các file khác hay file này có ý nghĩa như nào: Là "Dumb Component" chuẩn mực, nhận Props để cấu hình kiểu dáng (variant), kích cỡ (size), và trạng thái loading. Được tái sử dụng ở mọi nơi.
 * Các chức năng đặc biệt: Tự động hiển thị spinner và text loading (`LABELS.COMMON.PROCESSING`) khi prop `loading=true`. Quản lý style an toàn bằng object `variants` và `sizes`.
 * Các biến, hàm đặc biệt trong file: Interface `ButtonProps` kế thừa từ `HTMLMotionProps` giúp Component tương thích hoàn hảo với mọi API animation của framer-motion.
 */
'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

import { LABELS } from '@/constants/labels';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'red' | 'none';
  size?: 'sm' | 'md' | 'lg' | 'none';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  ...props
}: ButtonProps) => {
  const isNone = variant === 'none';
  const baseStyles = isNone 
    ? 'cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed' 
    : 'inline-flex cursor-pointer items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'gradient-bg text-white shadow-lg hover:brightness-110 active:scale-95',
    secondary: 'bg-orange-50 text-primary hover:bg-orange-100 active:scale-95',
    ghost: 'hover:bg-gray-100 text-gray-500 active:scale-95',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary active:scale-95',
    red: 'bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95',
    none: '',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-button',
    md: 'px-6 py-2.5 text-sm rounded-button',
    lg: 'px-8 py-4 text-body rounded-button',
    none: '',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      suppressHydrationWarning
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{LABELS.COMMON.PROCESSING}</span>
        </div>
      ) : children}
    </motion.button>
  );
};
