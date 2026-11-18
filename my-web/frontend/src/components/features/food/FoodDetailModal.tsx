/**
 * Mục đích file này để làm gì: Component Modal để xem thông tin chi tiết của một món ăn.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị đè lên màn hình hiện tại thay vì chuyển trang. Chứa ảnh lớn, mô tả dài, và trạng thái đóng/mở cửa của nhà hàng.
 * Các chức năng đặc biệt: Tích hợp nút xem bản đồ, chuyển hướng đến trang quán ăn, cảnh báo giờ đóng cửa.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SafeImage from '@/components/base/SafeImage';
import { X, MapPin, Navigation, Store, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl, isRestaurantCurrentlyOpen, getGoogleMapsUrl } from '@/utils/helpers';

export interface FoodDetailData {
  id?: number | string;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  address?: string;
  mapUrl?: string;
  map_url?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  restaurantName?: string;
  restaurant?: {
    id?: number;
    name: string;
    address?: string;
    mapUrl?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    isActive?: boolean;
    profile?: {
      openingHours?: string;
    };
  } | null;
  totalOrder?: number;
  totalLike?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  [key: string]: unknown;
}

interface FoodDetailModalProps {
  food: FoodDetailData;
  onClose: () => void;
}

// Removed local isRestaurantCurrentlyOpen to utils/helpers

export const FoodDetailModal = ({ food, onClose }: FoodDetailModalProps) => {
  const isOpen = isRestaurantCurrentlyOpen(
    food.restaurant?.profile?.openingHours,
    food.restaurant?.isActive
  );

  const mapUrl = getGoogleMapsUrl(
    food.lat || food.restaurant?.latitude,
    food.lng || food.restaurant?.longitude,
    food.mapUrl || food.map_url || food.restaurant?.mapUrl,
    food.restaurant?.name || food.restaurantName,
    food.address || food.restaurant?.address
  );

  return (
    <div className="modal-wrapper">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="modal-overlay"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="modal-card !p-0 max-w-2xl w-full max-h-[90vh] flex flex-col relative z-10 overflow-hidden shadow-2xl rounded-3xl"
      >
        {/* Banner ảnh phía trên tràn viền theo chuẩn GrabFood / ShopeeFood */}
        <div className="relative w-full h-64 sm:h-72 md:h-80 shrink-0 bg-gray-950/10 dark:bg-black/40 overflow-hidden">
          <SafeImage
            src={getValidImageUrl(food.image)}
            alt={food.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          {/* Lớp gradient bóng mờ mềm mại giúp làm nổi bật nút đóng và thông tin quán */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40 pointer-events-none" />

          {/* Nút đóng nổi bật ở góc trên bên phải */}
          <Button
            onClick={onClose}
            variant="none"
            size="none"
            className="absolute top-4 right-4 w-10 h-10 sm:w-11 sm:h-11 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20 shadow-lg cursor-pointer"
            aria-label={LABELS.COMMON.CANCEL}
          >
            <X size={20} />
          </Button>

          {/* Huy hiệu nhà hàng nằm trang nhã ở góc dưới ảnh */}
          <div className="absolute bottom-4 left-5 sm:left-7 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-primary dark:text-orange-400 rounded-full text-xs sm:text-sm font-bold shadow-lg">
              <Store size={14} className="shrink-0" />
              <span>{food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}</span>
            </span>
          </div>
        </div>

        {/* Nội dung thông tin món ăn phía dưới (cuộn độc lập nếu nội dung dài) */}
        <div className="p-5 sm:p-7 md:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Closed Warning Banner */}
          {!isOpen && (
            <div className="alert-box-rose">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{LABELS.RESTAURANT.CLOSED_WARNING_TITLE}</p>
                <p className="text-xs opacity-90 leading-relaxed mt-0.5">
                  {food.restaurant?.isActive === false 
                    ? LABELS.RESTAURANT.CLOSED_BY_MERCHANT 
                    : LABELS.RESTAURANT.CLOSED_OUTSIDE_HOURS(food.restaurant?.profile?.openingHours || LABELS.RESTAURANT.NOT_SET)}
                </p>
              </div>
            </div>
          )}

          <div>
            {food.restaurant?.profile?.openingHours && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-2">
                <Clock size={14} />
                <span>{LABELS.RESTAURANT.OPERATING_HOURS_LABEL}: {food.restaurant.profile.openingHours}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-slate-100 mb-3">{food.name}</h2>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-2xl sm:text-3xl font-black text-primary dark:text-orange-400">{formatCurrency(food.price)}</p>
              {(food.totalOrder !== undefined || food.totalLike !== undefined) && (
                <div className="flex gap-4 text-xs font-extrabold text-gray-500 dark:text-slate-400">
                  {food.totalOrder !== undefined && (
                    <span>Đã bán {food.totalOrder}</span>
                  )}
                  {food.totalLike !== undefined && (
                    <span className="flex items-center gap-0.5">❤️ {food.totalLike}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 mb-10 text-gray-600 dark:text-slate-300">
            <div>
              <h4 className="text-small font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{LABELS.FOOD.DETAIL_TITLE}</h4>
              <p className="leading-relaxed text-body">{food.description}</p>
            </div>

            {(food.calories || food.carbs || food.protein || food.fat) ? (
              <div className="p-4 bg-orange-50/50 dark:bg-slate-900/50 border border-orange-100/50 dark:border-slate-800/80 rounded-2xl">
                <h4 className="text-small font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  {LABELS.FOOD.NUTRITION_TITLE}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{LABELS.FOOD.NUTRITION_CALORIES}</span>
                    <span className="block text-base font-black text-primary mt-1">{food.calories ?? 0} <span className="text-[10px] font-normal text-gray-400">kcal</span></span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Carbs</span>
                    <span className="block text-base font-black text-gray-700 dark:text-slate-200 mt-1">{food.carbs ?? 0}<span className="text-[10px] font-normal text-gray-400">g</span></span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Protein</span>
                    <span className="block text-base font-black text-gray-700 dark:text-slate-200 mt-1">{food.protein ?? 0}<span className="text-[10px] font-normal text-gray-400">g</span></span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fat</span>
                    <span className="block text-base font-black text-gray-700 dark:text-slate-200 mt-1">{food.fat ?? 0}<span className="text-[10px] font-normal text-gray-400">g</span></span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl group/addr">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div className="flex-1">
                <h4 className="text-small font-bold text-gray-800 dark:text-slate-200">{LABELS.FOOD.RESTAURANT_TITLE}</h4>
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-between gap-2"
                  >
                    <span>{food.address || food.restaurant?.address || LABELS.FOOD.VIEW_MAP}</span>
                    <Navigation size={16} className="text-blue-500 group-hover/addr:scale-125 transition-transform" />
                  </a>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {food.address || food.restaurant?.address || LABELS.FOOD.NO_ADDRESS}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {food.restaurant?.id && (
              <Link href={`/restaurant/${food.restaurant.id}`} className="flex-1">
                <Button variant="primary" fullWidth className="py-4 rounded-2xl">
                  <Store size={20} className="mr-2" /> {LABELS.FOOD.STORE_PAGE}
                </Button>
              </Link>
            )}
            <Button variant="outline" className={food.restaurant?.id ? "flex-1 py-4 rounded-2xl" : "w-full py-4 rounded-2xl"}>
              <span>{LABELS.FOOD.REVIEWS}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
