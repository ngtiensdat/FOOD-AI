// Mục đích file này để làm gì: Component Dropdown hiển thị menu điều hướng nhanh của người dùng khi nhấn vào Avatar.
// Các file khác hay file này có ý nghĩa như nào: Được nhúng ở Navbar (Header), giúp truy cập nhanh vào các trang Quản trị, Dashboard, Cài đặt và Đăng xuất.
// Các chức năng đặc biệt: Hiển thị các menu riêng biệt dựa vào Role (Quyền) của người dùng (ADMIN vs RESTAURANT vs NORMAL).
// Các biến, hàm đặc biệt trong file: user (lấy thông tin và role), onLogout, onSettingsClick, onClose (đóng dropdown).
'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Store, User, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';

interface UserDropdownProps {
  user: { name?: string; role?: string; avatar?: string | null; [key: string]: unknown };
  onLogout: () => void;
  onSettingsClick: () => void;
  onClose?: () => void;
}

export const UserDropdown = ({ user, onLogout, onSettingsClick, onClose }: UserDropdownProps) => {
  const handleItemClick = (e: React.MouseEvent, action?: () => void) => {
    if (action) {
      action();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 top-14 w-60 bg-white dark:bg-gray-100 rounded-2xl shadow-2xl border border-gray-50 dark:border-gray-200 p-2 z-50"
    >
      {/* Profile Header Link */}
      <Link 
        href="/profile" 
        onClick={(e) => handleItemClick(e)}
        className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-200 hover:bg-orange-50 dark:hover:bg-gray-200 rounded-t-xl mb-1 transition-colors group"
      >
        <Avatar src={user.avatar} name={user.name} size={36} className="border border-white/50" />
        <div className="flex flex-col min-w-0 text-left">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-900 truncate group-hover:text-primary transition-colors">
            {user.name}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
            {user.role}
          </p>
        </div>
      </Link>

      {user.role === 'ADMIN' && (
        <Link href="/admin" onClick={(e) => handleItemClick(e)} className="dropdown-item">
          <Shield size={18} className="text-primary" /> {LABELS.NAV.ADMIN_PANEL}
        </Link>
      )}
      {user.role === 'RESTAURANT' && (
        <Link href="/restaurant-admin" onClick={(e) => handleItemClick(e)} className="dropdown-item">
          <Store size={18} className="text-primary" /> {LABELS.NAV.RESTAURANT_PANEL}
        </Link>
      )}
      
      <Link href="/dashboard" onClick={(e) => handleItemClick(e)} className="dropdown-item">
        <User size={18} className="text-primary" /> {LABELS.NAV.DASHBOARD}
      </Link>

      <button
        onClick={(e) => handleItemClick(e, onSettingsClick)}
        className="w-full dropdown-item text-left cursor-pointer"
      >
        <Settings size={18} className="text-primary" /> {LABELS.NAV.SETTINGS}
      </button>

      <button
        onClick={(e) => handleItemClick(e, onLogout)}
        className="w-full dropdown-item text-left text-red-500 mt-1 border-t border-gray-50 dark:border-gray-200 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
      >
        <LogOut size={18} /> {LABELS.COMMON.LOGOUT}
      </button>
    </motion.div>
  );
};

