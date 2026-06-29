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
import { ExpandableText } from '@/components/base/ExpandableText';
import { LABELS } from '@/constants/labels';
import { formatCurrency, formatDistance } from '@/utils/formatters';
import { getValidImageUrl, getGoogleMapsUrl } from '@/utils/helpers';

export interface FoodCardData {
  id?: number | string;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  restaurant?: { 
    name: string; 
    address?: string; 
    mapUrl?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    owner?: {
      badgeTitle?: string | null;
    } | null;
  } | null;
  restaurantName?: string;
  merchantBadge?: string | null;
  distance?: number;
  address?: string;
  mapUrl?: string;
  map_url?: string;
  lat?: number | string | null;
  lng?: number | string | null;
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
  const merchantBadge = food.merchantBadge || food.restaurant?.owner?.badgeTitle;

  useEffect(() => {
    setIsFavorite(!!food.isFavorite || !!food.is_favorite);
  }, [food.isFavorite, food.is_favorite]);

  const mapLink = getGoogleMapsUrl(
    food.lat || food.restaurant?.latitude,
    food.lng || food.restaurant?.longitude,
    food.mapUrl || food.map_url || food.restaurant?.mapUrl,
    food.restaurant?.name || food.restaurantName,
    food.address || food.restaurant?.address
  );
  const addressText = food.address || food.restaurant?.address;

  return (
    <div
      onClick={() => onViewDetail?.(food)}
      className="card-premium overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex h-[195px] w-full max-w-[240px] mx-auto flex-col group relative cursor-pointer"
    >
      <div className="relative h-28 w-full overflow-hidden shrink-0">
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
            <ShoppingBag size={28} />
          </div>
        )}

        <Button
          onClick={async (e) => {
            e.stopPropagation();
            if (onToggleFavorite) {
              const res = await onToggleFavorite(Number(food.id));
              setIsFavorite(res);
            } else {
              setIsFavorite(!isFavorite);
            }
          }}
          variant="none"
          size="none"
          className={`absolute top-2 right-2 p-1.5 rounded-lg shadow-sm transition-all hover:scale-110 z-10 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-400'
            }`}
          aria-label={LABELS.FOOD.ADD_FAVORITE}
        >
          <Heart size={14} fill={isFavorite ? "white" : "none"} />
        </Button>
      </div>
      <div className="p-3 flex flex-1 flex-col justify-between overflow-hidden">
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {/* Hàng 1: Tên món ăn (To, rõ ràng, màu xám đậm) */}
            <h3 className="font-bold text-xs text-gray-800 dark:text-gray-100 mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">
              {food.name}
            </h3>

            {/* Hàng 2: Tên nhà hàng & Danh hiệu Merchant (nếu có) */}
            <div className="flex items-center gap-1 mb-1.5 overflow-hidden">
              <span className="text-gray-400 dark:text-slate-400 text-[10px] font-medium truncate max-w-[70%]">
                {food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}
              </span>
              {merchantBadge && (
                <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[7px] font-bold whitespace-nowrap truncate uppercase tracking-wider">
                  {merchantBadge}
                </span>
              )}
            </div>

            {/* Hàng 3: Giá tiền & Số lượng bán (Đặt ngang hàng bằng flex-row để tiết kiệm diện tích dọc) */}
            <div className="flex justify-between items-center mt-auto border-t border-gray-50 dark:border-slate-800/50 pt-2 shrink-0">
              <span className="text-primary font-extrabold text-xs">
                {formatCurrency(food.price)}
              </span>

              {food.totalOrder !== undefined && (
                <span className="text-[9px] text-gray-400 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                  {LABELS.FOOD.SOLD_COUNT(food.totalOrder)}
                </span>
              )}
            </div>
          </div>

          {/* Hàng 4: Khoảng cách và Bản đồ (Chỉ hiển thị khi có dữ liệu) */}
          {(food.distance !== undefined || mapLink) && (
            <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-500 dark:text-slate-400">
              {food.distance !== undefined && food.distance !== null ? (
                <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold">
                  <Navigation size={9} className="rotate-45" />
                  <span>{formatDistance(food.distance)}</span>
                </div>
              ) : <div />}
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 hover:text-primary transition-colors"
                  aria-label={LABELS.FOOD.VIEW_MAP}
                >
                  <MapPin size={9} />
                  <span>{LABELS.FOOD.VIEW_MAP}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
