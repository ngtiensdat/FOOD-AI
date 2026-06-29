/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) hiển thị ô nhập liệu (Input hoặc Textarea) dùng chung cho toàn dự án.
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI thuần (Dumb Component), nhận các Props cơ bản (label, icon, error) và tự động thay đổi kiểu dáng tương ứng.
 * Các chức năng đặc biệt: Tích hợp 2 trong 1 (có thể biến thành Textarea nếu truyền cờ `isTextArea=true`). Hỗ trợ chèn Icon bên trong ô nhập liệu và tự động điều chỉnh padding (`pl-12`).
 * Các biến, hàm đặc biệt trong file: Ép kiểu `React.ElementType` để TypeScript chấp nhận truyền mảng `...props` linh hoạt cho cả `input` và `textarea` mà không gây lỗi.
 */
'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  isTextArea?: boolean;
  variant?: 'default' | 'none';
  rows?: number;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  label,
  icon: Icon,
  error,
  isTextArea = false,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const InputComponent = (isTextArea ? 'textarea' : 'input') as React.ElementType;

  if (variant === 'none') {
    return (
      <InputComponent
        ref={ref}
        suppressHydrationWarning
        className={className}
        {...props}
        value={props.value === null ? '' : props.value}
      />
    );
  }

  const inputStyles = `w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 ${
    Icon ? 'pl-12' : 'px-6'
  } pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-200 dark:focus:ring-orange-500/10 text-gray-800 transition-all text-sm`;

  return (
    <div className="space-y-2">
      {label && <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" 
            size={20} 
          />
        )}
        <InputComponent
          ref={ref}
          suppressHydrationWarning
          className={`${inputStyles} ${className} ${isTextArea ? 'min-h-[100px]' : ''}`}
          {...props}
          value={props.value === null ? '' : props.value}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
