// Mục đích file này để làm gì: Component Card hiển thị một món ăn (thông tin món, ảnh, giá, khoảng cách).
// Các file khác hay file này có ý nghĩa như nào: Dùng chung ở rất nhiều nơi (trang chủ, gợi ý AI, kết quả tìm kiếm).
// Các chức năng đặc biệt: Hiển thị icon bản đồ nếu có link map, tính toán khoảng cách (nếu có), nút yêu thích thông qua callback prop onToggleFavorite.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Component Pattern, Callback Propagation.
// Các biến, hàm đặc biệt trong file: FoodCard component.
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeImage from '@/components/base/SafeImage';
import { ShoppingBag, Navigation, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency, formatDistance } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';

export interface FoodCardData {
  id?: number | string;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  restaurant?: { name: string; address?: string; mapUrl?: string } | null;
  restaurantName?: string;
  distance?: number;
  mapUrl?: string;
  map_url?: string;
  totalOrder?: number;
  totalLike?: number;
  [key: string]: unknown;
}

interface FoodCardProps {
  food: FoodCardData;
  onViewDetail?: (food: FoodCardData) => void;
  onToggleFavorite?: (foodId: number) => Promise<boolean>;
}

export function FoodCard({ food, onViewDetail, onToggleFavorite }: FoodCardProps) {
  const [isFavorite, setIsFavorite] = useState(!!food.isFavorite || !!food.is_favorite);

  useEffect(() => {
    setIsFavorite(!!food.isFavorite || !!food.is_favorite);
  }, [food.isFavorite, food.is_favorite]);

  const mapLink = food.mapUrl || food.map_url || (food.restaurant as any)?.mapUrl;
  const addressText = food.address || (food.restaurant as any)?.address;

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="card-premium overflow-hidden hover:shadow-2xl"
    >
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        {food.image ? (
          <SafeImage 
            src={getValidImageUrl(food.image)} 
            alt={food.name} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag size={48} />
          </div>
        )}

        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (onToggleFavorite) {
              const res = await onToggleFavorite(Number(food.id));
              setIsFavorite(res);
            } else {
              setIsFavorite(!isFavorite);
            }
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-xl shadow-lg transition-all hover:scale-110 z-10 ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-400'
          }`}
          aria-label={LABELS.FOOD.ADD_FAVORITE}
        >
          <Heart size={20} fill={isFavorite ? "white" : "none"} />
        </button>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-primary font-bold text-lg">{formatCurrency(food.price)}</span>

          <div className="flex items-center gap-2">
            {food.distance !== undefined && food.distance !== null && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold">
                <Navigation size={12} />
                <span>{formatDistance(food.distance)}</span>
              </div>
            )}

            {mapLink && (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-gray-50 dark:bg-gray-200 text-gray-500 dark:text-gray-900 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                aria-label={LABELS.FOOD.VIEW_MAP}
              >
                <Navigation size={18} />
              </a>
            )}
          </div>
        </div>

        <h3 className="font-bold text-xl mb-0.5 line-clamp-1 text-gray-900">{food.name}</h3>

        <p className="text-primary text-xs font-bold mb-1 uppercase tracking-wider">
          {food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}
        </p>

        {addressText && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate" title={addressText}>
            <MapPin size={12} className="text-primary shrink-0" />
            {mapLink ? (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary hover:underline cursor-pointer truncate font-medium text-left"
              >
                {addressText}
              </a>
            ) : (
              <span className="truncate">{addressText}</span>
            )}
          </div>
        )}

        {/* Lượt bán & Lượt thích */}
        {(food.totalOrder !== undefined || food.totalLike !== undefined) && (
          <div className="flex gap-4 text-xs font-extrabold text-gray-500 dark:text-slate-400 mb-3">
            {food.totalOrder !== undefined && (
              <span>Đã bán {food.totalOrder}</span>
            )}
            {food.totalLike !== undefined && (
              <span className="flex items-center gap-0.5">❤️ {food.totalLike}</span>
            )}
          </div>
        )}

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 h-10">{food.description}</p>

        <Button
          fullWidth
          onClick={() => onViewDetail?.(food)}
          className="py-3"
        >
          {LABELS.FOOD.VIEW_DETAIL}
        </Button>
      </div>
    </motion.div>
  );
}
