/**
 * Mục đích file này để làm gì: Component hiển thị khung chat phản hồi của AI trợ lý ảo trên giao diện người dùng.
 * Các file khác hay file này có ý nghĩa như nào: Dùng chung ở màn hình Profile (Gợi ý món ăn) hoặc các tính năng chat với AI.
 * Các chức năng đặc biệt: Hỗ trợ hiệu ứng gõ phím mượt mà, và tự động render danh sách thẻ món ăn (FoodCard) nếu AI gợi ý.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SafeImage } from '@/components/base/SafeImage';
import { FoodCard } from '../food/FoodCard';
import { LABELS } from '@/constants/labels';
import { getValidImageUrl } from '@/utils/helpers';

export interface AiSuggestedFood {
  id?: number | string;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  restaurant?: { name: string };
  restaurantName?: string;
  distance?: number;
  mapUrl?: string;
  map_url?: string;
  [key: string]: unknown;
}

interface AiResponseBoxProps {
  isLoading: boolean;
  response: string;
  suggestedFoods: AiSuggestedFood[];
  onViewDetail: (food: AiSuggestedFood) => void;
}

export const AiResponseBox = ({
  isLoading,
  response,
  suggestedFoods,
  onViewDetail
}: AiResponseBoxProps) => {
  if (!isLoading && !response) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 max-w-3xl mx-auto text-left"
    >
      <div className="glass p-8 rounded-3xl border border-orange-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10">
            <SafeImage src="/logo.svg" alt="AI" fill className="object-contain rounded-xl" />
          </div>
          <span className="font-bold text-gray-800">{LABELS.COMMON.AI_ASSISTANT_NAME}</span>
        </div>

        {isLoading ? (
          <div className="flex gap-2 p-4 italic text-gray-400">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
            <span>{LABELS.HERO.AI_THINKING}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed text-body whitespace-pre-wrap">{response}</p>

            {suggestedFoods.length > 0 && (
              <div className="pt-6 border-t border-orange-100">
                <p className="text-small font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {LABELS.HERO.SUGGESTED_TITLE}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestedFoods.map((food, idx) => (
                    <FoodCard 
                      key={idx} 
                      food={{ ...food, image: getValidImageUrl(food.image) }} 
                      onViewDetail={onViewDetail} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
