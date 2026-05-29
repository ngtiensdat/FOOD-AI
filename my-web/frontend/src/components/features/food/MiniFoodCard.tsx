'use client';

import React from 'react';
import SafeImage from '@/components/base/SafeImage';
import { ShoppingBag } from 'lucide-react';
import { FoodCardData } from './FoodCard';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { LABELS } from '@/constants/labels';

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
      className="flex items-center gap-4 p-3 bg-white dark:bg-slate-950 hover:bg-orange-50/30 dark:hover:bg-slate-900/30 border border-gray-100 dark:border-slate-800 rounded-2xl cursor-pointer transition-all duration-350 shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Ảnh món ăn nhỏ 3x3 cm (80px x 80px) */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-55 dark:bg-slate-800 border border-gray-50 dark:border-slate-800">
        {food.image ? (
          <SafeImage 
            src={getValidImageUrl(food.image)} 
            alt={food.name} 
            fill 
            sizes="80px"
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-650">
            <ShoppingBag size={24} />
          </div>
        )}
      </div>

      {/* Thông tin món ăn bên cạnh */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">
        <div>
          <h4 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm md:text-base group-hover:text-primary transition-colors line-clamp-1 mb-0.5">
            {food.name}
          </h4>
          {food.description ? (
            <p className="text-gray-400 dark:text-slate-500 text-xs line-clamp-1">
              {food.description}
            </p>
          ) : (
            <p className="text-gray-350 dark:text-slate-600 text-xs italic">
              {LABELS.FOOD.NO_DESCRIPTION}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary font-extrabold text-sm md:text-base">
            {formatCurrency(food.price)}
          </span>
          
          {/* Nút Xem chi tiết nhỏ gọn */}
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-slate-500 group-hover:text-primary transition-colors border border-gray-100 dark:border-slate-800 dark:group-hover:border-primary group-hover:border-primary px-2.5 py-1 rounded-lg">
            {LABELS.FOOD.VIEW_DETAIL}
          </span>
        </div>
      </div>
    </div>
  );
}
