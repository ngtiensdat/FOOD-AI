'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Store, User, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { LABELS } from '@/constants/labels';

interface UserDropdownProps {
  user: any;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export const UserDropdown = ({ user, onLogout, onSettingsClick }: UserDropdownProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-50 p-2 z-50"
    >
      <div className="px-4 py-3 border-b border-gray-50 mb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Tài khoản: {user.name}
        </p>
      </div>

      {user.role === 'ADMIN' && (
        <Link href="/admin" className="dropdown-item">
          <Shield size={18} className="text-primary" /> {LABELS.NAV.ADMIN_PANEL}
        </Link>
      )}
      {user.role === 'RESTAURANT' && (
        <Link href="/restaurant-admin" className="dropdown-item">
          <Store size={18} className="text-primary" /> {LABELS.NAV.RESTAURANT_PANEL}
        </Link>
      )}
      <Link href="/dashboard" className="dropdown-item">
        <User size={18} className="text-primary" /> {LABELS.NAV.DASHBOARD}
      </Link>

      <button
        onClick={onSettingsClick}
        className="w-full dropdown-item"
      >
        <Settings size={18} className="text-primary" /> {LABELS.NAV.SETTINGS}
      </button>

      <button
        onClick={onLogout}
        className="w-full dropdown-item text-red-500 mt-1 border-t border-gray-50 hover:bg-red-50"
      >
        <LogOut size={18} /> {LABELS.COMMON.LOGOUT}
      </button>
    </motion.div>
  );
};
