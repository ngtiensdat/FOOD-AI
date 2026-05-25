/**
 * Mục đích file này để làm gì: Component hiển thị danh sách các món ăn vừa được xem/đề xuất gần đây.
 * Các file khác hay file này có ý nghĩa như nào: Thường được đặt ở cột trái hoặc phải của trang cá nhân Thực khách, giúp họ xem lại lịch sử gợi ý món ăn.
 * Các chức năng đặc biệt: Tự động tính toán số ngày kể từ lần cuối xem món ăn (sử dụng hàm `calculateDaysDifference`).
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { getValidImageUrl } from '@/utils/helpers';
import { calculateDaysDifference } from '@/utils/formatters';

export interface RecentFoodData {
  name: string;
  image?: string;
  [key: string]: unknown;
}

export interface RecentFoodItem {
  id: number | string;
  visitedAt: string | Date;
  food?: RecentFoodData;
  [key: string]: unknown;
}

interface RecentFoodsListProps {
  items: RecentFoodItem[];
  onViewDetail?: (food: RecentFoodData) => void;
  title?: string;
  onSeeMore?: () => void;
}

export const RecentFoodsList = ({ items, onViewDetail, title, onSeeMore }: RecentFoodsListProps) => {
  return (
    <section className="card-container p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title || LABELS.CUSTOMER.RECENT_FOODS}</h3>
        {onSeeMore && items.length > 0 && (
          <button 
            type="button"
            onClick={onSeeMore} 
            className="text-xs text-primary font-bold hover:underline"
          >
            {LABELS.COMMON.SEE_MORE}
          </button>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const food = item.food;
          if (!food) return null;

          // Tính số ngày trước đã ghé thăm
          const diffDays = calculateDaysDifference(item.visitedAt);

          return (
            <div 
              key={item.id} 
              onClick={() => onViewDetail?.(food)}
              className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all"
            >
              <div className="relative w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                <Image 
                  src={getValidImageUrl(food.image)} 
                  alt={food.name} 
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-small group-hover:text-primary transition-colors">
                  {food.name}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  {LABELS.CUSTOMER.RECENT_FOOD_SUGGEST(diffDays)}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-primary" />
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-small text-gray-400 text-center py-4">{LABELS.CUSTOMER.NO_HISTORY}</p>
        )}
      </div>
    </section>
  );
};
