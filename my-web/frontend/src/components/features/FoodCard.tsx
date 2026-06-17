'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, Navigation, Heart } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency, formatDistance } from '@/utils/formatters';

interface FoodCardProps {
  food: any;
  onViewDetail?: (food: any) => void;
}

export function FoodCard({ food, onViewDetail }: FoodCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white rounded-card overflow-hidden shadow-md hover:shadow-2xl transition-all border border-gray-100"
    >
      <div className="h-48 bg-gray-100 relative group overflow-hidden">
        {food.image ? (
          <Image 
            src={food.image} 
            alt={food.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag size={48} />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-xl shadow-lg transition-all hover:scale-110 z-10 ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-400'
          }`}
          aria-label={LABELS.COMMON.OTHER}
        >
          <Heart size={20} fill={isFavorite ? "white" : "none"} />
        </button>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-primary font-bold text-lg">{formatCurrency(food.price)}</span>

          <div className="flex items-center gap-2">
            {food.distance !== undefined && food.distance !== null && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">
                <Navigation size={12} />
                <span>{formatDistance(food.distance)}</span>
              </div>
            )}

            {(food.mapUrl || food.map_url) && (
              <a
                href={food.mapUrl || food.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                aria-label={LABELS.COMMON.OTHER}
              >
                <Navigation size={18} />
              </a>
            )}
          </div>
        </div>

        <h3 className="font-bold text-xl mb-0.5 line-clamp-1">{food.name}</h3>

        <p className="text-primary text-xs font-bold mb-3 uppercase tracking-wider">
          {food.restaurant?.name || food.restaurantName || LABELS.FOOD.SYSTEM}
        </p>

        <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{food.description}</p>

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
