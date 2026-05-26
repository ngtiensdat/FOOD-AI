/**
 * Mục đích file này để làm gì: Component Modal hiển thị danh mục những Người dùng và Nhà hàng mà bạn đang theo dõi.
 * Các file khác hay file này có ý nghĩa như nào: Tương tự FollowersModal nhưng phân chia rõ 2 danh sách Users và Restaurants riêng biệt.
 * Các chức năng đặc biệt: Danh sách được tách làm 2 khu vực rõ ràng để dễ dàng phân biệt.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Users, Lock } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';
import { User } from '@/types/user';

export type FollowingRestaurant = User & { address?: string };

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  users?: User[];
  restaurants?: FollowingRestaurant[];
  onUserClick?: (user: User) => void;
  onRestaurantClick?: (restaurant: FollowingRestaurant) => void;
  title?: string;
  emptyLabel?: string;
}

export const FollowingModal = ({
  isOpen,
  onClose,
  loading,
  error,
  users = [],
  restaurants = [],
  onUserClick,
  onRestaurantClick,
  title,
  emptyLabel
}: FollowingModalProps) => {
  if (!isOpen) return null;

  const modalTitle = title || LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWING_TITLE;
  const modalEmpty = emptyLabel || LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWING_EMPTY;

  const hasUsers = users && users.length > 0;
  const hasRestaurants = restaurants && restaurants.length > 0;
  const isEmpty = !hasUsers && !hasRestaurants;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-card max-w-md w-full p-6 relative border border-gray-100 dark:border-slate-800 shadow-2xl z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
        >
          <X size={20} />
        </button>

        <h3 className="text-h3 font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users size={22} className="text-primary" />
          <span>{modalTitle}</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 font-semibold text-small flex flex-col items-center gap-2">
            <Lock size={32} className="text-red-400 mb-2" />
            <span>{error}</span>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12 text-gray-400 text-small">
            {modalEmpty}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto flex flex-col gap-6 pr-1">
            {/* Section 1: Users */}
            {hasUsers && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">{LABELS.COMMON.USER}</h4>
                <div className="flex flex-col gap-3">
                  {users.map((followingUser) => {
                    const userName = followingUser.profile?.fullName || followingUser.name || LABELS.COMMON.USER;
                    const userAvatar = followingUser.profile?.avatar;
                    const userRoleLabel = followingUser.role === 'RESTAURANT' ? LABELS.AUTH.RESTAURANT_ROLE : LABELS.AUTH.CUSTOMER;

                    return (
                      <div 
                        key={followingUser.id} 
                        onClick={() => onUserClick && onUserClick(followingUser)}
                        className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <Avatar 
                          src={userAvatar} 
                          name={followingUser.name} 
                          size={40} 
                          className="bg-primary/10 text-primary font-black text-body shrink-0" 
                          fallbackClassName="!bg-transparent"
                        />
                        <div>
                          <h5 className="text-body font-bold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                            {userName}
                          </h5>
                          <p className="text-mini text-gray-450 dark:text-gray-400 font-medium">
                            {userRoleLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Restaurants */}
            {hasRestaurants && (
              <div>
                {hasUsers && <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">{LABELS.COMMON.STORE}</h4>}
                <div className="flex flex-col gap-3">
                  {restaurants.map((restaurantItem) => {
                    const coverImage = restaurantItem.profile?.coverImage;
                    const address = restaurantItem.address || '';

                    return (
                      <div 
                        key={restaurantItem.id} 
                        onClick={() => onRestaurantClick && onRestaurantClick(restaurantItem)}
                        className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <Avatar 
                          src={coverImage} 
                          name={restaurantItem.name} 
                          size={40} 
                          className="rounded-xl bg-orange-50 dark:bg-slate-800/50 text-primary font-black text-body shrink-0" 
                          fallbackClassName="!bg-transparent"
                        />
                        <div>
                          <h5 className="text-body font-bold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                            {restaurantItem.name}
                          </h5>
                          <p className="text-mini text-gray-450 dark:text-gray-400 font-medium line-clamp-1">
                            {address}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
