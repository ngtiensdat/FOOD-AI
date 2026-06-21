/**
 * @fileoverview frontend/src/components/base/LogoSpinner.tsx
 * @description Component loading thống nhất toàn ứng dụng — hiển thị logo Food AI quay tròn.
 * Dùng để thay thế mọi trạng thái loading cấp trang, cấp section, và cấp container.
 * Các loading nhỏ trong Button giữ nguyên spinner border để phù hợp với context nút bấm.
 */
'use client';

import React from 'react';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

interface LogoSpinnerProps {
  /** Kích cỡ vòng quay và logo (mặc định: 'md') */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hiển thị dạng toàn trang (chiếm full min-h-screen) */
  fullPage?: boolean;
  /** Text hiển thị bên dưới logo (tuỳ chọn) */
  label?: string;
  /** Class ghi đè vùng bao ngoài */
  className?: string;
}

const sizeMap = {
  sm: { outer: 'w-10 h-10', inner: 'w-7 h-7', ring: 'w-10 h-10' },
  md: { outer: 'w-14 h-14', inner: 'w-9 h-9', ring: 'w-14 h-14' },
  lg: { outer: 'w-20 h-20', inner: 'w-13 h-13', ring: 'w-20 h-20' },
  xl: { outer: 'w-28 h-28', inner: 'w-18 h-18', ring: 'w-28 h-28' },
};

export const LogoSpinner: React.FC<LogoSpinnerProps> = ({
  size = 'md',
  fullPage = false,
  label,
  className = '',
}) => {
  const s = sizeMap[size];

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Vòng xoay bên ngoài */}
      <div className={`relative ${s.ring} flex items-center justify-center`}>
        {/* Ring gradient xoay */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin`}
          style={{
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--primary-light)',
          }}
        />
        {/* Logo ở giữa — không quay, chỉ ring quay */}
        <div className={`relative ${s.inner} z-10`}>
          <SafeImage
            src="/logo.png"
            alt={LABELS.COMMON.BRAND_LOGO_ALT}
            fill
            sizes="80px"
            className="object-contain"
          />
        </div>
      </div>

      {label && (
        <p className="text-sm font-semibold text-gray-400 dark:text-slate-500 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="page-loading">
        {spinner}
      </div>
    );
  }

  return spinner;
};
