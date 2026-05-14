'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/base/Button';
import { UserDropdown } from './UserDropdown';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar = ({ activeTab, setActiveTab }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { id: 'home', label: LABELS.NAV.HOME },
    { id: 'explore', label: LABELS.NAV.EXPLORE },
    { id: 'offers', label: LABELS.NAV.OFFERS },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between border-b border-gray-50">
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <Image src="/favicon.ico" alt="Food AI Logo" fill className="object-contain" />
        </div>
        <span className="text-2xl font-bold gradient-text tracking-tight">Food AI</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-1 transition-all ${
              activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 relative">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-500"
          onClick={() => toast.info(LABELS.NAV.SEARCH_PLACEHOLDER)}
          aria-label={LABELS.NAV.FEATURES}
        >
          <Search size={20} />
          <span className="hidden lg:inline text-xs font-bold uppercase tracking-tighter">{LABELS.NAV.FEATURES}</span>
        </Button>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-all flex items-center justify-center bg-gray-100"
              aria-label={LABELS.AUTH.PROFILE}
            >
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name || 'User'} fill className="object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
              aria-label={LABELS.COMMON.OTHER}
            >
              <Menu size={24} />
            </button>

            {showMenu && (
              <UserDropdown 
                user={user} 
                onLogout={logout} 
                onSettingsClick={() => { setActiveTab('settings'); setShowMenu(false); }}
              />
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" className="rounded-full">
              <User size={18} className="mr-2" />
              <span>{LABELS.AUTH.LOGIN}</span>
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};
