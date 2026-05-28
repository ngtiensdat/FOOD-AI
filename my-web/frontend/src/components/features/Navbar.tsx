/**
 * Mục đích file này để làm gì: Component Thanh điều hướng (Navbar) chính của website.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị thanh menu ngang ở trên cùng, chứa logo, các tab chuyển hướng chính và nút tài khoản người dùng/menu mở rộng.
 * Các chức năng đặc biệt: Tích hợp chế độ Dark Mode (ThemeToggle), tự động theo dõi trạng thái đăng nhập để hiển thị nút Đăng nhập hoặc Avatar.
 */
'use client';
import { ThemeToggle } from '@/components/base/ThemeToggle';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/base/Button';
import { Avatar } from '@/components/base/Avatar';
import { UserDropdown } from './UserDropdown';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar = ({ activeTab, setActiveTab }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'explore') {
      router.push('/explore');
    } else if (pathname === '/') {
      setActiveTab(tabId);
    } else {
      if (tabId === 'home') {
        router.push('/');
      } else {
        router.push(`/?tab=${tabId}`);
      }
    }
  };

  if (!mounted) return null;

  const tabs = [
    { id: 'home', label: LABELS.NAV.HOME },
    { id: 'explore', label: LABELS.NAV.EXPLORE },
    { id: 'offers', label: LABELS.NAV.OFFERS },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between border-b border-gray-50 dark:border-slate-900">
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <div className="relative w-10 h-10">
          <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain" />
        </div>
        <span className="text-2xl font-bold gradient-text tracking-tight">{LABELS.COMMON.BRAND_NAME}</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
        {tabs.map((tab) => (
          <button
            suppressHydrationWarning
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`pb-1 transition-all ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 relative">
        <ThemeToggle />
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
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer p-1 rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
              aria-label={LABELS.NAV.USER_MENU}
            >
              <Avatar 
                src={user.avatar} 
                name={user.name} 
                size={40} 
                className="border-2 border-white dark:border-gray-200 shadow-md bg-gray-100" 
              />
              <ChevronDown 
                size={16} 
                className={`text-gray-500 dark:text-slate-400 transition-transform duration-300 ${
                  showMenu ? 'rotate-180 text-primary' : ''
                }`} 
              />
            </button>

            {showMenu && (
              <>
                {/* Lớp phủ trong suốt hỗ trợ đóng menu khi click ra ngoài */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent cursor-default" 
                  onClick={() => setShowMenu(false)} 
                />
                <UserDropdown
                  user={user}
                  onLogout={logout}
                  onSettingsClick={() => {
                    handleTabClick('settings');
                    setShowMenu(false);
                  }}
                  onClose={() => setShowMenu(false)}
                />
              </>
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
