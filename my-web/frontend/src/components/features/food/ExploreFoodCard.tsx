/**
 * @fileoverview frontend/src/components/features/food/ExploreFoodCard.tsx
 * @description Component thẻ món ăn trang Khám Phá với thiết kế hình khối không đối xứng (Asymmetric: Chữ nhật đứng, Vuông, Chữ nhật ngang, Chữ nhật cao) và huy hiệu cá nhân hóa (Ăn chay, Đồ cay, Đề xuất).
 **/
'use client';

import React, { useState, useEffect } from 'react';
import SafeImage from '@/components/base/SafeImage';
import { Heart, MapPin, Store, Sparkles, Flame, Leaf } from 'lucide-react';
import { FoodCardData } from './FoodCard';
import { formatCurrency, formatDistance } from '@/utils/formatters';
import { getValidImageUrl, getGoogleMapsUrl } from '@/utils/helpers';

interface ExploreFoodCardProps {
  food: FoodCardData;
  index: number;
  onViewDetail?: (food: FoodCardData) => void;
  onToggleFavorite?: (foodId: number) => Promise<boolean>;
}

export function ExploreFoodCard({
  food,
  index,
  onViewDetail,
  onToggleFavorite,
}: ExploreFoodCardProps) {
  const [isFavorite, setIsFavorite] = useState(!!food.isFavorite || !!food.is_favorite);

  useEffect(() => {
    setIsFavorite(!!food.isFavorite || !!food.is_favorite);
  }, [food.isFavorite, food.is_favorite]);

  // Các tỉ lệ không đối xứng theo chu kỳ 4 món:
  // 0: Chữ nhật đứng dọc (3:4)
  // 1: Hình vuông hoàn hảo (1:1)
  // 2: Chữ nhật nằm ngang (4:3)
  // 3: Chữ nhật cao thanh lịch (4:5)
  const aspectRatios = [
    'aspect-[3/4]',    // 0: Chữ nhật đứng
    'aspect-square',   // 1: Hình vuông
    'aspect-[4/3]',    // 2: Chữ nhật ngang
    'aspect-[4/5]',    // 3: Chữ nhật đứng vừa
  ];
  const currentAspect = aspectRatios[index % aspectRatios.length];

  // Phát hiện thuộc tính đặc biệt của món để gắn huy hiệu thông minh
  const nameLower = (food.name || '').toLowerCase();
  const descLower = (food.description || '').toLowerCase();
  const tagsJoined = Array.isArray(food.tags) ? food.tags.join(' ').toLowerCase() : '';

  const isVegetarian =
    nameLower.includes('chay') ||
    tagsJoined.includes('chay') ||
    descLower.includes('chay') ||
    nameLower.includes('salad') ||
    nameLower.includes('thanh đạm') ||
    tagsJoined.includes('healthy');

  const isSpicy =
    nameLower.includes('cay') ||
    nameLower.includes('sa tế') ||
    nameLower.includes('lẩu thái') ||
    nameLower.includes('chili') ||
    tagsJoined.includes('cay') ||
    tagsJoined.includes('spicy');

  const isRecommended = !!food.isAdminRecommended || !!food.isFeaturedToday;

  const mapLink = getGoogleMapsUrl(
    food.lat || food.restaurant?.latitude,
    food.lng || food.restaurant?.longitude,
    food.mapUrl || food.map_url || food.restaurant?.mapUrl,
    food.restaurant?.name || food.restaurantName,
    food.address || food.restaurant?.address,
  );

  return (
    <div
      onClick={() => onViewDetail?.(food)}
      className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100/90 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Container Ảnh không đối xứng */}
      <div className={`relative w-full ${currentAspect} overflow-hidden bg-gray-100 dark:bg-slate-800`}>
        {food.image ? (
          <SafeImage
            src={getValidImageUrl(food.image)}
            alt={food.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 gap-1">
            <span className="text-2xl">🍜</span>
            <span className="text-[11px] font-medium">Food AI</span>
          </div>
        )}

        {/* Lớp phủ Gradient đáy ảnh tạo chiều sâu */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Huy hiệu Góc trên bên Trái (Món Chay / Vị Cay / Nổi bật) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {isVegetarian && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              <Leaf size={11} className="shrink-0" />
              <span>Ăn chay</span>
            </span>
          )}
          {isSpicy && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/90 text-white backdrop-blur-md shadow-sm">
              <Flame size={11} className="shrink-0" />
              <span>Vị cay</span>
            </span>
          )}
          {!isVegetarian && !isSpicy && isRecommended && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
              <Sparkles size={11} className="shrink-0" />
              <span>Đề xuất</span>
            </span>
          )}
        </div>

        {/* Nút Yêu thích Góc trên bên Phải */}
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            if (onToggleFavorite) {
              const res = await onToggleFavorite(Number(food.id));
              setIsFavorite(res);
            } else {
              setIsFavorite(!isFavorite);
            }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/40 dark:border-slate-700/40 flex items-center justify-center text-gray-500 dark:text-slate-300 hover:text-red-500 hover:scale-110 active:scale-95 transition-all shadow-sm z-10"
          aria-label="Yêu thích"
        >
          <Heart
            size={15}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-slate-300'}
          />
        </button>

        {/* Tag Giá nổi bật gắn trực tiếp đáy ảnh */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-white/95 dark:bg-slate-900/95 text-primary backdrop-blur-md shadow-md border border-white/50 dark:border-slate-700/50">
            {formatCurrency(food.price)}
          </span>
        </div>

        {/* Khoảng cách hiển thị góc dưới bên phải nếu có */}
        {food.distance !== undefined && food.distance !== null && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
              {formatDistance(food.distance)}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung thông tin món ăn */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
            {food.name}
          </h3>

          {/* Quán ăn / Nhà hàng */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1 font-medium">
            <Store size={13} className="shrink-0 text-gray-400 dark:text-slate-500" />
            <span className="truncate">{food.restaurant?.name || food.restaurantName || 'Quán ăn ngon'}</span>
          </div>
        </div>

        {/* Tags & Vị trí */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
          {Array.isArray(food.tags) && food.tags.length > 0 ? (
            <span className="truncate max-w-[130px] font-medium">
              #{food.tags[0]}
            </span>
          ) : (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Đang phục vụ</span>
          )}

          {mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-gray-500 dark:text-slate-400"
              title="Xem vị trí trên bản đồ"
            >
              <MapPin size={12} className="text-primary" />
              <span>Chỉ đường</span>
            </a>
          ) : (
            <span className="text-[10px] text-gray-400">Hà Nội</span>
          )}
        </div>
      </div>
    </div>
  );
}
