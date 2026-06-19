/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) để tạo cấu trúc Layout chuẩn cho các khối nội dung (Section) và Tiêu đề khối (SectionHeader). Chia chúng làm 2 màu (2 chữ cuối)
 * Các file khác hay file này có ý nghĩa như nào: Là "Dumb Component" thiết lập các quy chuẩn về khoảng cách (`p-layout`, `max-w-7xl`), màu nền (bgStyles) và Typography cho toàn bộ dự án.
 * Các chức năng đặc biệt: `SectionHeader` có logic tự động bôi màu Gradient (`gradient-text`) cho 2 chữ cuối cùng của Tiêu đề để tạo điểm nhấn thị giác đồng nhất.
 * Các biến, hàm đặc biệt trong file: `bgStyles` ánh xạ an toàn các theme màu để Tailwind CSS có thể biên dịch chính xác mà không bị mất class.
 */
'use client';

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bg?: 'white' | 'gray' | 'orange' | 'blue' | 'transparent';
  container?: boolean;
}

export const Section = ({
  children,
  className = '',
  id,
  bg = 'white',
  container = true,
}: SectionProps) => {
  const bgStyles = {
    white: 'bg-gray-50',
    gray: 'bg-gray-100/50',
    orange: 'bg-primary/5',
    blue: 'bg-blue-500/5',
    transparent: 'bg-transparent',
  };

  return (
    <section
      id={id}
      className={`p-layout transition-colors duration-300 ${bgStyles[bg]} ${className}`}
    >
      <div className={container ? 'max-w-7xl mx-auto' : ''}>
        {children}
      </div>
    </section>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  icon,
  actions,
  className = '',
}: SectionHeaderProps) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 ${className}`}>
      <div>
        <h2 className="text-h2 flex items-center gap-3">
          {icon}
          <span className="flex flex-wrap gap-2">
            {title.split(' ').map((word, i) => (
              <span key={i} className={i >= title.split(' ').length - 2 ? 'gradient-text' : ''}>
                {word}
              </span>
            ))}
          </span>
        </h2>
        {subtitle && <p className="text-body text-gray-500 mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};
