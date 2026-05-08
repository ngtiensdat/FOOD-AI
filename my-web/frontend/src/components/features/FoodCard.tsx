'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Navigation, Heart } from 'lucide-react';

interface FoodCardProps {
  food: any;
  onViewDetail?: (food: any) => void;
}

export function FoodCard({ food, onViewDetail }: FoodCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-gray-100"
    >
      <div
        className="h-50 bg-cover bg-center bg-gray-100 flex items-center justify-center text-gray-300 relative group"
        style={{ backgroundImage: (food.image) ? `url("${food.image}")` : 'none' }}
      >
        {!food.image && <ShoppingBag size={48} />}

        {/* Nút Yêu thích ở góc phải */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-xl shadow-lg transition-all hover:scale-110 z-10 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-400'
            }`}
          title="Thêm vào yêu thích"
        >
          <Heart size={20} fill={isFavorite ? "white" : "none"} />
        </button>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-primary font-bold text-lg">{food.price?.toLocaleString()}đ</span>

          {/* Icon bản đồ bên phải giá tiền */}
          {(food.mapUrl || food.map_url) && (
            <a
              href={food.mapUrl || food.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
              title="Xem bản đồ"
            >
              <Navigation size={18} />
            </a>
          )}
        </div>

        {/* Tên món ăn */}
        <h3 className="font-bold text-xl mb-0.5 line-clamp-1">{food.name}</h3>

        {/* Tên nhà hàng/quán ăn (Mới thêm) */}
        <p className="text-primary text-xs font-bold mb-3 uppercase tracking-wider">
          {food.restaurant?.name || food.restaurantName || 'Hệ thống'}
        </p>

        <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{food.description}</p>

        <button
          onClick={() => onViewDetail?.(food)}
          className="w-full gradient-bg text-white py-3 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all"
        >
          Xem chi tiết
        </button>
      </div>
    </motion.div>
  );
}
