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

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const { id, name, city, district, profile, foods = [], _count } = restaurant;
  const followersCount = _count?.followers ?? 0;

  // Thu thập các tag món ăn độc bản phục vụ kết xuất danh mục tiêu biểu
  const typicalTags = Array.from(
    new Set(foods.flatMap((f) => f.tags || []))
  ).slice(0, 3); // Lấy tối đa 3 tag đặc trưng

  return (
    <Link href={`/restaurant/${id}`}>
      <div className="bg-white dark:bg-slate-900 rounded-card overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full cursor-pointer">
        {/* Phần ảnh bìa (Cover Image) */}
        <div className="h-32 bg-gray-150 dark:bg-slate-800 relative overflow-hidden">
          {profile?.coverImage ? (
            <SafeImage
              src={profile.coverImage}
              alt={`${name} Cover`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-100 to-amber-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <Store size={32} className="text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Phần thân thông tin */}
        <div className="px-5 pb-5 pt-10 relative flex-1 flex flex-col justify-between">
          {/* Logo hình tròn đặt đè lên góc ảnh bìa */}
          <div className="absolute -top-10 left-5 w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-900 overflow-hidden shadow-md bg-white">
            {profile?.logo ? (
              <SafeImage
                src={profile.logo}
                alt={`${name} Logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center">
                <Store size={24} className="text-primary" />
              </div>
            )}
          </div>

          <div>
            {/* Tên nhà hàng & Badge Verified */}
            <div className="flex justify-between items-start mb-1.5 gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 shrink-0 flex items-center gap-0.5">
                <Check size={8} /> {LABELS.RESTAURANT.EDIT_MODAL.VERIFIED}
              </span>
            </div>

            {/* Giới thiệu ngắn (Bio) */}
            <p className="text-xs text-gray-500 dark:text-slate-400 italic mb-4 line-clamp-1">
              {profile?.bio || LABELS.RESTAURANT.CARD_LABELS.DEFAULT_BIO}
            </p>

            {/* Lượt follow & số món ăn */}
            <div className="flex gap-4 text-xs text-gray-500 dark:text-slate-400 mb-4 border-t border-b border-gray-50 dark:border-slate-800/40 py-2.5">
              <div className="flex items-center gap-1">
                <Users size={13} className="text-primary" />
                <span className="font-bold text-gray-700 dark:text-slate-200">{followersCount}</span>
                <span>{LABELS.RESTAURANT.CARD_LABELS.FOLLOWERS_SUFFIX}</span>
              </div>
              <div className="flex items-center gap-1">
                <Utensils size={13} className="text-primary" />
                <span className="font-bold text-gray-700 dark:text-slate-200">{foods.length}+</span>
                <span>{LABELS.RESTAURANT.CARD_LABELS.FOODS_SUFFIX}</span>
              </div>
            </div>
          </div>

          {/* Địa điểm & Thẻ món ăn */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 truncate max-w-[50%]">
              <MapPin size={12} className="text-primary shrink-0" />
              <span className="truncate">{district || city || LABELS.RESTAURANT.CARD_LABELS.DEFAULT_LOCATION}</span>
            </div>

            {/* Tags tiêu biểu */}
            <div className="flex gap-1.5 overflow-hidden">
              {typicalTags.length > 0 ? (
                typicalTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-orange-50/80 dark:bg-orange-950/15 text-primary border border-orange-100/50 dark:border-orange-900/30 px-2 py-0.5 rounded-md text-xs font-bold capitalize whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-700 px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap">
                  {LABELS.RESTAURANT.CARD_LABELS.DEFAULT_CATEGORY}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
