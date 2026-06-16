'use client';

// Mục đích file này để làm gì: Component hiển thị thẻ thông tin món ăn dạng thu nhỏ, phục vụ cho đề xuất AI và danh sách menu rút gọn.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng trong ChatFeed và RestaurantFoodGrid để hiển thị các món ăn gợi ý.
// Các chức năng đặc biệt: Tự căn chỉnh responsive, hỗ trợ click trực tiếp trên ảnh/thông tin để xem chi tiết.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Clean UI Component, React Props Pattern.
// Các biến, hàm đặc biệt trong file: MiniFoodCard component.

import React from 'react';
import SafeImage from '@/components/base/SafeImage';
import { ShoppingBag } from 'lucide-react';
import { FoodCardData } from './FoodCard';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { LABELS } from '@/constants/labels';
import { ExpandableText } from '@/components/base/ExpandableText';

interface MiniFoodCardProps {
  food: FoodCardData;
  onViewDetail?: (food: FoodCardData) => void;
}

export function MiniFoodCard({ food, onViewDetail }: MiniFoodCardProps) {
  return (
    <div
      onClick={() => onViewDetail?.(food)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetail?.(food);
        }
      }}
      role="button"
      tabIndex={0}
      className="flex items-center gap-3 p-2 bg-white dark:bg-slate-950 hover:bg-orange-50/30 dark:hover:bg-slate-900/30 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer transition-all duration-350 shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-primary w-full"
    >
      {/* Ảnh món ăn nhỏ 1.6x1.6 cm (64px x 64px) */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-800">
        {food.image ? (
          <SafeImage
            src={getValidImageUrl(food.image)}
            alt={food.name}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-700">
            <ShoppingBag size={20} />
          </div>
        )}
      </div>

      {/* Thông tin món ăn bên cạnh */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-h-[2.75rem]">
          <h4 className="font-extrabold text-gray-800 dark:text-slate-200 text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-1 mb-0.5">
            {food.name}
          </h4>
          {food.description ? (
            <ExpandableText
              text={food.description}
              collapsedLines={1}
              threshold={32}
              className="text-gray-400 dark:text-slate-500"
              textClassName="text-[10px] md:text-xs"
            />
          ) : (
            <p className="text-gray-400 dark:text-slate-600 text-[10px] md:text-xs italic">
              {LABELS.FOOD.NO_DESCRIPTION}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-primary font-extrabold text-xs md:text-sm">
            {formatCurrency(food.price)}
          </span>
        </div>
      </div>
    </div>
  );
}
