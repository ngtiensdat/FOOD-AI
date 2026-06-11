/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) để tạo một danh sách cuộn ngang (Slider/Carousel) với nút điều hướng mượt mà.
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI thuần (Dumb Component), nhận các khối nội dung (`children`) và tự động dàn hàng ngang, có thể cuộn bằng tay hoặc bấm nút. Rất phù hợp để hiển thị danh sách Món ăn, Nhà hàng nổi bật.
 * Các chức năng đặc biệt: Tích hợp logic tính toán `scrollLeft` để trượt sang ngang chính xác bằng 80% chiều rộng của container mỗi lần bấm nút. Có cơ chế tự động bôi màu Gradient cho 2 chữ cái cuối của Tiêu đề (giống `Section.tsx`).
 * Các biến, hàm đặc biệt trong file: `bgStyles` chuẩn hoá các màu nền an toàn cho TailwindCSS. Hàm `scroll` thao tác trực tiếp với DOM thông qua `useRef`.
 */
'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

import { LABELS } from '@/constants/labels';

interface SliderProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  bg?: 'white' | 'gray' | 'orange' | 'blue' | 'transparent';
}

export const Slider = ({ children, title, subtitle, icon, bg = 'white' }: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      sliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const navActions = (
    <div className="hidden md:flex gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('left')}
        className="w-12 h-12 rounded-full p-0"
        aria-label={LABELS.COMMON.SCROLL_LEFT}
      >
        <ChevronLeft size={24} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('right')}
        className="w-12 h-12 rounded-full p-0"
        aria-label={LABELS.COMMON.SCROLL_RIGHT}
      >
        <ChevronRight size={24} />
      </Button>
    </div>
  );

  const bgStyles = {
    white: 'bg-white dark:bg-slate-950',
    gray: 'bg-gray-50/50 dark:bg-gray-100/10',
    orange: 'bg-orange-50/30 dark:bg-primary/5',
    blue: 'bg-blue-50/30 dark:bg-blue-950/10',
    transparent: 'bg-transparent',
  };

  return (
    <section className={`p-layout transition-colors duration-300 ${bgStyles[bg]}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
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
          {navActions}
        </div>

        <div
          ref={sliderRef}
          className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
        >
          {React.Children.map(children, (child) => (
            <div className="min-w-[280px] md:min-w-[320px] snap-start">
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
