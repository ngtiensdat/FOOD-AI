/**
 * Mục đích file này để làm gì: Component Thanh điều hướng (Navbar) chính của website.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị thanh menu ngang ở trên cùng, chứa logo, các tab chuyển hướng chính và nút tài khoản người dùng/menu mở rộng.
 * Các chức năng đặc biệt: Tích hợp chế độ Dark Mode (ThemeToggle), tự động theo dõi trạng thái đăng nhập để hiển thị nút Đăng nhập hoặc Avatar.
 */
'use client';
import { ThemeToggle } from '@/components/base/ThemeToggle';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, User, ChevronDown, Bell, Heart, MessageSquare, Forward, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/providers/socket-provider';
import { notificationService } from '@/services/notification.service';
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
  const [visible, setVisible] = useState(true);
  const prevScrollPos = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      // Nếu cuộn gần sát top (dưới 10px), luôn hiển thị Navbar
      if (currentScrollPos < 10) {
        setVisible(true);
        prevScrollPos.current = currentScrollPos;
        return;
      }
      
      const isScrollingDown = currentScrollPos > prevScrollPos.current;
      
      // Chỉ kích hoạt ẩn hiện nếu cuộn di chuyển lớn hơn 5px để tránh nhấp nháy
      if (Math.abs(currentScrollPos - prevScrollPos.current) > 5) {
        setVisible(!isScrollingDown);
        prevScrollPos.current = currentScrollPos;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const pathname = usePathname();
  const router = useRouter();

  const { socket } = useSocket();
  interface NotificationItem {
    id: string;
    title: string;
    content: string;
    type: 'LIKE' | 'COMMENT' | 'REPLY' | 'SHARE' | 'LEVEL_UP' | 'PROFILE_UPDATE' | 'SYSTEM' | 'WARNING' | 'PROMOTION' | 'MODERATION_REMOVE' | 'MODERATION_RESOLVE' | 'MODERATION_DISMISS' | string;
    isRead: boolean;
    senderAvatar?: string;
    createdAt: string;
    postId?: number;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationService.getNotifications(1, 50);
          setNotifications(res || []);
        } catch (e) {
          console.error('Lỗi khi tải thông báo:', e);
        }
      };
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      toast.success(notif.title || 'Thông báo mới');
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notifId: string) => {
    try {
      await notificationService.markAsRead(notifId);
      const updated = notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n);
      setNotifications(updated);
    } catch (e) {
      console.error('Lỗi khi đọc thông báo:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
    } catch (e) {
      console.error('Lỗi khi đọc tất cả thông báo:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (e) {
      console.error('Lỗi khi xoá tất cả thông báo:', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const renderNotificationAvatar = (notif: NotificationItem, size = 32) => {
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
      <nav className={`fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 px-6 md:px-12 grid grid-cols-3 items-center border-b border-gray-50 dark:border-slate-900 transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity justify-self-start">
        <div className="relative w-10 h-10">
          <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="40px" className="object-contain" />
        </div>
        <span className="text-2xl font-bold gradient-text tracking-tight">{LABELS.COMMON.BRAND_NAME}</span>
      </Link>

      <div className="hidden md:flex items-center justify-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest justify-self-center">
        {tabs.map((tab) => (
          <Button
            suppressHydrationWarning
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`pb-1 transition-all ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
            variant="none"
            size="none"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-4 relative justify-self-end">
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
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors relative focus:outline-none cursor-pointer"
                aria-label="Thông báo"
                variant="none"
                size="none"
              >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-900 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-900 pb-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">{LABELS.NAV.NOTIFICATIONS.TITLE}</span>
                      <div className="flex gap-2 text-[10px] font-bold text-primary">
                        <Button onClick={handleMarkAllAsRead} className="hover:underline" variant="none" size="none">{LABELS.NAV.NOTIFICATIONS.MARK_ALL_READ}</Button>
                        <span className="text-gray-300">|</span>
                        <Button onClick={handleClearAll} className="hover:underline text-rose-500" variant="none" size="none">{LABELS.NAV.NOTIFICATIONS.CLEAR_ALL}</Button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 font-bold">{LABELS.NAV.NOTIFICATIONS.EMPTY}</p>
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

            <Button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer p-1 rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
              aria-label={LABELS.NAV.USER_MENU}
              variant="none"
              size="none"
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
            </Button>

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
                {LABELS.NAV.NOTIFICATIONS.TYPES[activeNotification.type as keyof typeof LABELS.NAV.NOTIFICATIONS.TYPES] || LABELS.NAV.NOTIFICATIONS.TYPES.DEFAULT}
              </span>
              <Button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer font-bold"
                variant="none"
                size="none"
              >
                ✕
              </Button>
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
                {LABELS.NAV.NOTIFICATIONS.SENT_AT(new Date(activeNotification.createdAt).toLocaleString(typeof window !== 'undefined' && localStorage.getItem('lang') === 'en' ? 'en-US' : 'vi-VN'))}
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
            <div className="pt-2 flex flex-col gap-2">
              {activeNotification.postId && ['LIKE', 'COMMENT', 'REPLY'].includes(activeNotification.type) && (
                <Button
                  variant="primary"
                  className="w-full py-3 rounded-2xl shadow-lg shadow-primary/10 font-bold bg-gradient-to-r from-orange-500 to-rose-600 text-white"
                  onClick={() => {
                    setShowDetailModal(false);
                    const targetHash = `#post-${activeNotification.postId}`;
                    if (pathname === '/forum') {
                      window.location.hash = targetHash;
                      const element = document.getElementById(`post-${activeNotification.postId}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
                        setTimeout(() => {
                          element.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
                        }, 3000);
                      }
                    } else {
                      router.push(`/forum${targetHash}`);
                    }
                  }}
                >
                  {LABELS.NAV.NOTIFICATIONS.GO_TO_POST}
                </Button>
              )}
              <Button
                variant={activeNotification.postId && ['LIKE', 'COMMENT', 'REPLY'].includes(activeNotification.type) ? 'outline' : 'primary'}
                className="w-full py-3 rounded-2xl font-bold"
                onClick={() => setShowDetailModal(false)}
              >
                {LABELS.NAV.NOTIFICATIONS.DISMISS}
              </Button>
            </div>
          </div>
        </div>
      </>
    )}
  </>
);
};
