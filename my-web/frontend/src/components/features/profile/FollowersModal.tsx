/**
 * Mục đích file này để làm gì: Component Modal hiển thị danh sách người theo dõi hoặc người đang theo dõi.
 * Các file khác hay file này có ý nghĩa như nào: Dùng chung ở trang Profile công khai của người dùng hoặc nhà hàng.
 * Các chức năng đặc biệt: Xử lý cả hai cấu trúc dữ liệu trả về từ API (phẳng hoặc lồng trong thuộc tính `user`).
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Users, Lock } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';
import { User, UserRole } from '@/types/user';

export type FollowerItem = User & { user?: User };

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  followersList: FollowerItem[];
  onItemClick: (item: User) => void;
  title?: string;
  emptyLabel?: string;
}

export const FollowersModal = ({
  isOpen,
  onClose,
  loading,
  error,
  followersList,
  onItemClick,
  title,
  emptyLabel
}: FollowersModalProps) => {
  if (!isOpen) return null;

  const modalTitle = title || LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWERS_TITLE;
  const modalEmpty = emptyLabel || LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWERS_EMPTY;

  return (
    <div className="modal-wrapper">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-overlay"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="modal-card max-w-md w-full !p-6"
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
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 font-semibold text-small flex flex-col items-center gap-2">
            <Lock size={32} className="text-red-400 mb-2" />
            <span>{error}</span>
          </div>
        ) : followersList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-small">
            {modalEmpty}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto flex flex-col gap-4 pr-1">
            {followersList.map((item) => {
              // Hỗ trợ cả cấu trúc { user } (từ restaurant API) và cấu trúc { id, name } phẳng (từ User API)
              const userObj = item.user || item;
              if (!userObj) return null;

              const userName = userObj.profile?.fullName || userObj.name || LABELS.COMMON.USER;
              const userEmail = userObj.email;
              const userAvatar = userObj.profile?.avatar;
              const userRoleLabel = userObj.role === UserRole.RESTAURANT ? LABELS.AUTH.RESTAURANT_ROLE : LABELS.AUTH.CUSTOMER;

              return (
                <div 
                  key={userObj.id} 
                  onClick={() => onItemClick(userObj)}
                  className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <Avatar 
                    src={userAvatar} 
                    name={userObj.name} 
                    size={44} 
                    className="bg-primary/10 text-primary font-black text-body shrink-0" 
                    fallbackClassName="!bg-transparent"
                  />
                  <div>
                    <h4 className="text-body font-extrabold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                      {userName}
                    </h4>
                    <p className="text-mini text-gray-400 dark:text-gray-400 font-medium">
                      {userEmail || userRoleLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
