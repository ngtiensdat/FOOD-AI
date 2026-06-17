'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, MapPin, Navigation, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';

interface FoodDetailModalProps {
  food: any;
  onClose: () => void;
}

export const FoodDetailModal = ({ food, onClose }: FoodDetailModalProps) => {
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
            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
            alt={food.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-4">
              {food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}
            </span>
            <h2 className="text-h2 text-gray-800 mb-2">{food.name}</h2>
            <p className="text-2xl font-bold text-primary">{formatCurrency(food.price)}</p>
          </div>

          <div className="space-y-6 mb-10 text-gray-600">
            <div>
              <h4 className="text-small font-bold text-gray-400 uppercase tracking-widest mb-2">{(LABELS as any).FOOD.DETAIL_TITLE}</h4>
              <p className="leading-relaxed text-body">{food.description}</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group/addr">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div className="flex-1">
                <h4 className="text-small font-bold text-gray-800">{LABELS.FOOD.RESTAURANT_TITLE}</h4>
                {food.mapUrl || food.map_url ? (
                  <a
                    href={food.mapUrl || food.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium flex items-center justify-between gap-2"
                  >
                    <span>{food.address || food.restaurant?.address || LABELS.FOOD.VIEW_MAP}</span>
                    <Navigation size={16} className="text-blue-500 group-hover/addr:scale-125 transition-transform" />
                  </a>
                ) : (
                  <p className="text-sm text-gray-600">
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
