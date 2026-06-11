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
import { Menu, Search, User, ChevronDown, Bell, Heart, MessageSquare, Forward, Trophy } from 'lucide-react';
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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const loadNotifications = () => {
        const stored = localStorage.getItem(`foodai_notifications_${user.id}`);
        if (stored) {
          try {
            setNotifications(JSON.parse(stored));
          } catch (e) {}
        }
      };
      loadNotifications();
      window.addEventListener('storage', loadNotifications);
      window.addEventListener('foodai_notifications_updated', loadNotifications);
      return () => {
        window.removeEventListener('storage', loadNotifications);
        window.removeEventListener('foodai_notifications_updated', loadNotifications);
      };
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notifId: number) => {
    if (!user) return;
    const updated = notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    setNotifications(updated);
    localStorage.setItem(`foodai_notifications_${user.id}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('foodai_notifications_updated'));
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem(`foodai_notifications_${user.id}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('foodai_notifications_updated'));
  };

  const handleClearAll = () => {
    if (!user) return;
    setNotifications([]);
    localStorage.setItem(`foodai_notifications_${user.id}`, JSON.stringify([]));
    window.dispatchEvent(new Event('foodai_notifications_updated'));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const renderNotificationAvatar = (notif: any, size = 32) => {
    const fallbackClasses = `rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-900 shrink-0`;
    
    if (notif.senderAvatar) {
      return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <SafeImage
            src={notif.senderAvatar}
            alt="Sender Avatar"
            fill
            sizes={`${size}px`}
            className="rounded-full object-cover border border-gray-100 dark:border-slate-800"
          />
        </div>
      );
    }
    
    switch (notif.type) {
      case 'LIKE':
        return (
          <div className={`${fallbackClasses} text-rose-500 bg-rose-50 dark:bg-rose-950/20`} style={{ width: size, height: size }}>
            <Heart size={size * 0.5} className="fill-current" />
          </div>
        );
      case 'COMMENT':
      case 'REPLY':
        return (
          <div className={`${fallbackClasses} text-blue-500 bg-blue-50 dark:bg-blue-950/20`} style={{ width: size, height: size }}>
            <MessageSquare size={size * 0.5} />
          </div>
        );
      case 'SHARE':
        return (
          <div className={`${fallbackClasses} text-amber-500 bg-amber-50 dark:bg-amber-950/20`} style={{ width: size, height: size }}>
            <Forward size={size * 0.5} />
          </div>
        );
      case 'LEVEL_UP':
        return (
          <div className={`${fallbackClasses} text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20`} style={{ width: size, height: size }}>
            <Trophy size={size * 0.5} />
          </div>
        );
      case 'PROFILE_UPDATE':
        return (
          <div className={`${fallbackClasses} text-gray-500 bg-gray-50 dark:bg-slate-900`} style={{ width: size, height: size }}>
            <User size={size * 0.5} />
          </div>
        );
      default:
        return (
          <div className={`${fallbackClasses} text-primary bg-primary/5`} style={{ width: size, height: size }}>
            <Bell size={size * 0.5} />
          </div>
        );
    }
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === 'explore') {
      router.push('/explore');
    } else if (tabId === 'forum') {
      router.push('/forum');
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
    { id: 'forum', label: LABELS.NAV.FORUM },
    { id: 'offers', label: LABELS.NAV.OFFERS },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between border-b border-gray-50 dark:border-slate-900">
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <div className="relative w-10 h-10">
          <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="40px" className="object-contain" />
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
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors relative focus:outline-none cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-900 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-900 pb-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">Thông báo</span>
                      <div className="flex gap-2 text-[10px] font-bold text-primary">
                        <button onClick={handleMarkAllAsRead} className="hover:underline">Đã đọc tất cả</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={handleClearAll} className="hover:underline text-rose-500">Xóa hết</button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 font-bold">Bạn chưa có thông báo nào.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              handleNotificationClick(notif.id);
                              setActiveNotification(notif);
                              setShowDetailModal(true);
                              setShowNotifications(false);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                              notif.isRead
                                ? 'bg-gray-50/30 dark:bg-slate-900/10 border-gray-50 dark:border-slate-900 text-gray-500'
                                : 'bg-primary/5 border-primary/10 dark:bg-primary/10 text-gray-800 dark:text-slate-100 font-extrabold shadow-sm'
                            }`}
                          >
                            {renderNotificationAvatar(notif, 36)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="font-black text-xs truncate block pr-2">{notif.title}</span>
                                <span className="text-[9px] text-gray-400 font-bold shrink-0">
                                  {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="leading-relaxed font-bold truncate block">{notif.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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

    {showDetailModal && activeNotification && (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 fade-in"
          onClick={() => setShowDetailModal(false)}
        >
          {/* Modal Container */}
          <div 
            className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 relative space-y-5 text-center transform scale-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top category label & close button */}
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-900 pb-3">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-full">
                {activeNotification.type === 'LIKE' && 'Tương tác Thả tim'}
                {activeNotification.type === 'COMMENT' && 'Bình luận mới'}
                {activeNotification.type === 'REPLY' && 'Phản hồi bình luận'}
                {activeNotification.type === 'SHARE' && 'Chia sẻ bài viết'}
                {activeNotification.type === 'LEVEL_UP' && 'Thăng cấp độ'}
                {activeNotification.type === 'PROFILE_UPDATE' && 'Tài khoản cập nhật'}
                {activeNotification.type === 'MODERATION_REMOVE' && 'Kiểm duyệt nội dung'}
                {activeNotification.type === 'MODERATION_RESOLVE' && 'Báo cáo xử lý'}
                {activeNotification.type === 'MODERATION_DISMISS' && 'Báo cáo từ chối'}
                {activeNotification.type === 'SYSTEM' && 'Thông báo hệ thống'}
                {activeNotification.type === 'WARNING' && 'Cảnh báo hệ thống'}
                {activeNotification.type === 'PROMOTION' && 'Khuyến mại hệ thống'}
                {!['LIKE', 'COMMENT', 'REPLY', 'SHARE', 'LEVEL_UP', 'PROFILE_UPDATE', 'MODERATION_REMOVE', 'MODERATION_RESOLVE', 'MODERATION_DISMISS', 'SYSTEM', 'WARNING', 'PROMOTION'].includes(activeNotification.type) && 'Thông báo'}
              </span>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Large Avatar container */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-20 h-20 rounded-full border-4 border-primary/20 dark:border-primary/40 p-1 bg-white dark:bg-slate-950 shadow-md flex items-center justify-center">
                {activeNotification.senderAvatar ? (
                  <SafeImage
                    src={activeNotification.senderAvatar}
                    alt="Sender Avatar"
                    fill
                    sizes="80px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    {activeNotification.type === 'LIKE' && <Heart size={36} className="fill-current text-rose-500" />}
                    {(activeNotification.type === 'COMMENT' || activeNotification.type === 'REPLY') && <MessageSquare size={36} className="text-blue-500" />}
                    {activeNotification.type === 'SHARE' && <Forward size={36} className="text-amber-500" />}
                    {activeNotification.type === 'LEVEL_UP' && <Trophy size={36} className="text-yellow-500" />}
                    {activeNotification.type === 'PROFILE_UPDATE' && <User size={36} className="text-gray-500" />}
                    {(!activeNotification.senderAvatar && ['SYSTEM', 'WARNING', 'PROMOTION', 'MODERATION_REMOVE', 'MODERATION_RESOLVE', 'MODERATION_DISMISS'].includes(activeNotification.type)) && <Bell size={36} className="text-primary" />}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-2">
                Gửi lúc {new Date(activeNotification.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>

            {/* Title and message */}
            <div className="space-y-2">
              <h4 className="text-lg font-black text-gray-800 dark:text-white leading-snug">
                {activeNotification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-slate-300 font-semibold leading-relaxed bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-50 dark:border-slate-900 text-left whitespace-pre-wrap">
                {activeNotification.content}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full py-3 rounded-2xl shadow-lg shadow-primary/10 font-bold"
                onClick={() => setShowDetailModal(false)}
              >
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      </>
    )}
  </>
);
};
