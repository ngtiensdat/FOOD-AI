'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { getValidImageUrl } from '@/utils/helpers';

interface RecentFoodsListProps {
  items: any[];
  onViewDetail?: (food: any) => void;
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
          const visitedDate = new Date(item.visitedAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - visitedDate.getTime());
          const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

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
