'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, MapPin, Navigation, Store, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';

interface FoodDetailModalProps {
  food: any;
  onClose: () => void;
}

// Robust helper to check if restaurant is open based on hours & manual status
const isRestaurantCurrentlyOpen = (openingHours?: string, isActive?: boolean) => {
  if (isActive === false) return false;
  if (!openingHours) return true; // default open

  try {
    const cleanHours = openingHours.replace(/\s+/g, '');
    const match = cleanHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) return true;

    const [, sh, sm, eh, em] = match;
    const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    if (startMin <= endMin) {
      return currentMin >= startMin && currentMin <= endMin;
    } else {
      // Over midnight
      return currentMin >= startMin || currentMin <= endMin;
    }
  } catch {
    return true;
  }
};

export const FoodDetailModal = ({ food, onClose }: FoodDetailModalProps) => {
  const isOpen = isRestaurantCurrentlyOpen(
    food.restaurant?.profile?.openingHours,
    food.restaurant?.isActive
  );

  return (
    <div className="modal-backdrop">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="modal-card !p-0 max-w-4xl relative z-10 flex flex-col md:flex-row overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-20 md:text-gray-500 md:bg-gray-100 md:hover:bg-gray-200"
          aria-label={LABELS.COMMON.CANCEL}
        >
          <X size={24} />
        </button>

        <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
          <Image
            src={getValidImageUrl(food.image)}
            alt={food.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
          {/* Closed Warning Banner */}
          {!isOpen && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
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

          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-orange-50 dark:bg-orange-950/30 text-primary dark:text-orange-400 rounded-full text-sm font-bold">
              {food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}
            </span>
            {food.restaurant?.profile?.openingHours && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mt-2">
                <Clock size={14} />
                <span>{LABELS.RESTAURANT.OPERATING_HOURS_LABEL}: {food.restaurant.profile.openingHours}</span>
              </div>
            )}
            <h2 className="text-h2 text-gray-800 dark:text-slate-100 mb-2 mt-4">{food.name}</h2>
            <p className="text-2xl font-bold text-primary dark:text-orange-400">{formatCurrency(food.price)}</p>
          </div>

          <div className="space-y-6 mb-10 text-gray-600 dark:text-slate-300">
            <div>
              <h4 className="text-small font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{(LABELS as any).FOOD.DETAIL_TITLE}</h4>
              <p className="leading-relaxed text-body">{food.description}</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl group/addr">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div className="flex-1">
                <h4 className="text-small font-bold text-gray-800 dark:text-slate-200">{LABELS.FOOD.RESTAURANT_TITLE}</h4>
                {food.mapUrl || food.map_url ? (
                  <a
                    href={food.mapUrl || food.map_url}
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
            <Link href={`/profile?id=${food.restaurant?.ownerId}`} className="flex-1">
              <Button variant="primary" fullWidth className="py-4 rounded-2xl">
                <Store size={20} className="mr-2" /> {LABELS.FOOD.STORE_PAGE}
              </Button>
            </Link>
            <Button variant="outline" fullWidth className="py-4 rounded-2xl">
              <span>{LABELS.FOOD.REVIEWS}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
