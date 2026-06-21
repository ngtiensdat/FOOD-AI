/**
 * @fileoverview frontend/src/components/features/restaurant/RestaurantCard.tsx
 * @module RestaurantCard
 * @description Component thẻ thông tin quán ăn công khai chuyên nghiệp, hiển thị ảnh bìa, logo, tick xác minh, số lượng người theo dõi, số lượng thực đơn và các danh mục tiêu biểu.
 **/

import React from 'react';
import Link from 'next/link';
import { MapPin, Users, Utensils, Check, Store } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { Restaurant } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';
import { ExpandableText } from '@/components/base/ExpandableText';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const { id, name, city, district, profile, foods = [], _count, distance } = restaurant;
  const followersCount = _count?.followers ?? 0;


  // Thu thập các tag món ăn độc bản phục vụ kết xuất danh mục tiêu biểu
  const typicalTags = restaurant.cuisines && restaurant.cuisines.length > 0
    ? restaurant.cuisines.slice(0, 3)
    : Array.from(
      new Set(foods.flatMap((f) => f.tags || []))
    ).slice(0, 3); // Lấy tối đa 3 tag đặc trưng

  return (
    <Link href={`/restaurant/${id}`}>
      <div className="card-restaurant rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-[265px] w-full max-w-[240px] mx-auto cursor-pointer relative">
        {/* Phần ảnh bìa (Cover Image) */}
        <div className="h-24 bg-gray-200 dark:bg-slate-800 relative overflow-hidden shrink-0">
          {profile?.coverImage ? (
            <SafeImage
              src={profile.coverImage}
              alt={`${name} Cover`}
              fill
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-100 to-amber-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <Store size={24} className="text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Phần thân thông tin */}
        <div className="px-3 pb-2 pt-5 relative flex-1 flex flex-col justify-between">
          {/* Logo hình tròn đặt đè lên góc ảnh bìa */}
          <div className="absolute -top-6 left-3 w-10 h-10 z-10 rounded-lg border-2 border-white dark:border-slate-900 overflow-hidden shadow-sm bg-white shrink-0">
            {profile?.logo ? (
              <SafeImage
                src={profile.logo}
                alt={`${name} Logo`}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center">
                <Store size={16} className="text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Tên nhà hàng & Badge Verified */}
              <div className="flex justify-between items-center mb-0.5 gap-1.5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                  {name}
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 shrink-0 flex items-center gap-0.5">
                  <Check size={8} /> {LABELS.RESTAURANT.EDIT_MODAL.VERIFIED}
                </span>
              </div>

              {/* Điểm đánh giá sao */}
              {restaurant.ratingAvg !== undefined && restaurant.ratingAvg !== null && (
                <div className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-extrabold mb-0.5">
                  <span>⭐</span>
                  <span>{restaurant.ratingAvg.toFixed(1)}</span>
                  <span className="text-gray-400 font-bold">({restaurant.ratingCount || 0})</span>
                </div>
              )}

              {/* Giới thiệu ngắn (Bio) */}
              <ExpandableText
                text={profile?.bio || LABELS.RESTAURANT.CARD_LABELS.DEFAULT_BIO}
                collapsedLines={2}
                threshold={60}
                className="mb-1 min-h-[2rem]"
                textClassName="text-[10px] text-gray-500 dark:text-slate-400 italic leading-tight"
              />

              {/* Lượt follow & số món ăn */}
              <div className="flex gap-2 text-[10px] text-gray-500 dark:text-slate-400 mb-1 border-t border-b border-gray-50 dark:border-slate-800/40 py-1 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Users size={10} className="text-primary" />
                  <span className="font-bold text-gray-700 dark:text-slate-200">{followersCount}</span>
                  <span>{LABELS.RESTAURANT.CARD_LABELS.FOLLOWERS_SUFFIX}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Utensils size={10} className="text-primary" />
                  <span className="font-bold text-gray-700 dark:text-slate-200">{foods.length}+</span>
                  <span>{LABELS.RESTAURANT.CARD_LABELS.FOODS_SUFFIX}</span>
                </div>
              </div>
            </div>

            {/* Địa điểm & Thẻ món ăn */}
            <div className="flex items-center justify-between mt-auto shrink-0">
              {restaurant.mapUrl ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(restaurant.mapUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-slate-400 hover:text-primary hover:underline cursor-pointer truncate max-w-[55%]"
                  title={restaurant.address || LABELS.FOOD.VIEW_MAP}
                >
                  <MapPin size={10} className="text-primary shrink-0" />
                  <span className="truncate">
                    {distance !== undefined && distance !== null ? `${distance.toFixed(1)} km • ` : ''}
                    {district || city || LABELS.RESTAURANT.CARD_LABELS.DEFAULT_LOCATION}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-slate-400 truncate max-w-[55%]">
                  <MapPin size={10} className="text-primary shrink-0" />
                  <span className="truncate">
                    {distance !== undefined && distance !== null ? `${distance.toFixed(1)} km • ` : ''}
                    {district || city || LABELS.RESTAURANT.CARD_LABELS.DEFAULT_LOCATION}
                  </span>
                </div>
              )}

              {/* Tags tiêu biểu */}
              <div className="flex gap-1 overflow-hidden">
                {typicalTags.length > 0 ? (
                  typicalTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-orange-50/80 dark:bg-orange-950/15 text-primary border border-orange-100/50 dark:border-orange-900/30 px-1 py-px rounded text-[9px] font-bold capitalize whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-700 px-1 py-px rounded text-[9px] font-bold whitespace-nowrap">
                    {LABELS.RESTAURANT.CARD_LABELS.DEFAULT_CATEGORY}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
