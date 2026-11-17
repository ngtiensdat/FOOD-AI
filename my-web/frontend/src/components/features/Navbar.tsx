/**
 * Mục đích file này để làm gì: Component Thanh điều hướng (Navbar) chính của website.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị thanh menu ngang ở trên cùng, chứa logo, các tab chuyển hướng chính và nút tài khoản người dùng/menu mở rộng.
 * Các chức năng đặc biệt: Tích hợp chế độ Dark Mode (ThemeToggle), tự động theo dõi trạng thái đăng nhập để hiển thị nút Đăng nhập hoặc Avatar.
 * Kiến thức: DIP – notification logic được ủy quyền cho useNotifications hook.
 */
'use client';
import { ThemeToggle } from '@/components/base/ThemeToggle';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, User, ChevronDown, Bell, Heart, MessageSquare, Forward, Trophy, Home, Compass, Tag, Store, Shield, Ticket, MessageCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/providers/socket-provider';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { Button } from '@/components/base/Button';
import { Avatar } from '@/components/base/Avatar';
import { UserDropdown } from './UserDropdown';
import { ChatCenter } from './chat/ChatCenter';
import { chatService } from '@/services/chat.service';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { FeatureSearchModal } from './FeatureSearchModal';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (_tab: string) => void;
}

export const Navbar = ({ activeTab, setActiveTab }: NavbarProps) => {
  const { user, logout, isAdmin, isRestaurant, isCustomer } = useAuth();
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const _tabParam = searchParams.get('tab');
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const prevScrollPos = useRef(0);

  const [showChatCenter, setShowChatCenter] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showFeatureSearch, setShowFeatureSearch] = useState(false);

  // Lắng nghe phím tắt Ctrl+K hoặc Cmd+K để mở hộp thoại tìm kiếm tính năng
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowFeatureSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchUnreadMessagesCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const convs = await chatService.getConversations('inbox');
      const requests = await chatService.getConversations('requests');
      
      const unreadInbox = convs.filter(c => c.lastMessage && !(c.lastMessage as { isRead?: boolean; sender?: { id: string | number } }).isRead && c.lastMessage.sender?.id !== user.id).length;
      const unreadRequests = requests.length;
      
      setUnreadMessagesCount(unreadInbox + unreadRequests);
    } catch (e) {
      console.warn('Lỗi lấy số tin nhắn chưa đọc:', e);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    chatService.getConversations('inbox').then(convs => {
      return chatService.getConversations('requests').then(requests => {
        if (!isMounted) return;
        const unreadInbox = convs.filter(c => c.lastMessage && !(c.lastMessage as { isRead?: boolean; sender?: { id: string | number } }).isRead && c.lastMessage.sender?.id !== user.id).length;
        setUnreadMessagesCount(unreadInbox + requests.length);
      });
    }).catch(e => {
      console.warn('Lỗi lấy số tin nhắn chưa đọc:', e);
    });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showChatCenter]); // use user?.id (stable primitive) not user object to prevent infinite re-render

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleMsg = () => {
      fetchUnreadMessagesCount();
    };

    socket.on('direct_message', handleMsg);
    return () => {
      socket.off('direct_message', handleMsg);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id]); // stable primitive dependency

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

  // DIP: Notification logic được ủy quyền cho useNotifications hook
  const {
    notifications,
    showNotifications,
    setShowNotifications,
    activeNotification,
    setActiveNotification,
    showDetailModal,
    setShowDetailModal,
    unreadCount,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleClearAll,
  } = useNotifications({ userId: user?.id, socket });

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

  const getTabHref = (tabId: string) => {
    if (tabId === 'explore') return '/explore';
    if (tabId === 'forum') return '/forum';
    if (tabId === 'dashboard') return '/dashboard';
    if (tabId === 'restaurant-admin') return '/restaurant-admin';
    if (tabId === 'admin') return '/admin';
    if (tabId === 'vouchers') return '/vouchers';
    if (tabId === 'home') return '/';
    return `/?tab=${tabId}`;
  };

  useEffect(() => {
    router.prefetch('/explore');
    router.prefetch('/forum');
    router.prefetch('/dashboard');
    router.prefetch('/restaurant-admin');
    router.prefetch('/admin');
    router.prefetch('/profile');
    router.prefetch('/vouchers');
    router.prefetch('/');
  }, [router]);

  if (!mounted) return null;

  // Active tab detection
  let currentActive = activeTab || '';
  if (!currentActive) {
    if (pathname === '/explore') currentActive = 'explore';
    else if (pathname === '/forum') currentActive = 'forum';
    else if (pathname === '/dashboard') currentActive = 'dashboard';
    else if (pathname === '/restaurant-admin') currentActive = 'restaurant-admin';
    else if (pathname === '/admin') currentActive = 'admin';
    else if (pathname === '/vouchers') currentActive = 'vouchers';
    else currentActive = 'home';
  }

  const tabs = [
    { id: 'home', label: LABELS.NAV.HOME, icon: Home },
    { id: 'explore', label: LABELS.NAV.EXPLORE, icon: Compass },
    { id: 'forum', label: LABELS.NAV.FORUM, icon: MessageSquare },
    { id: 'offers', label: LABELS.NAV.OFFERS, icon: Tag },
  ];

  if (user) {
    if (isCustomer) {
      tabs.push({ id: 'vouchers', label: LABELS.LOYALTY.TITLE || 'Ví Voucher', icon: Ticket });
    }
    tabs.push({ id: 'dashboard', label: LABELS.AUTH?.PROFILE || 'Trang cá nhân', icon: User });
    if (isRestaurant) {
      tabs.push({ id: 'restaurant-admin', label: LABELS.RESTAURANT?.MERCHANT_HUB || 'Quản lý quán ăn', icon: Store });
    }
    if (isAdmin) {
      tabs.push({ id: 'admin', label: LABELS.ADMIN?.PANEL_TITLE || 'Quản trị hệ thống', icon: Shield });
    }
  }

  const hasSidebar = pathname.startsWith('/admin') || pathname.startsWith('/restaurant-admin');
  const isManagementPage = hasSidebar || pathname.startsWith('/pos');

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 px-4 md:px-12 flex items-center justify-between md:grid md:grid-cols-3 border-b border-gray-50 dark:border-slate-900 transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      <Link href="/" className={`flex items-center gap-2 hover:opacity-90 transition-opacity justify-self-start ${hasSidebar ? 'pl-10 md:pl-0' : 'pl-0'}`}>
        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="40px" className="object-contain" />
        </div>
        <span className="text-xl md:text-2xl font-bold gradient-text tracking-tight">{LABELS.COMMON.BRAND_NAME}</span>
      </Link>

      <div className="hidden md:flex items-center justify-center gap-1 h-full justify-self-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActive === tab.id;
          return (
            <div key={tab.id} className="relative group h-full flex items-center animate-fade-in">
              <Link
                href={getTabHref(tab.id)}
                onClick={(e) => {
                  if (pathname === '/' && setActiveTab && (tab.id === 'home' || tab.id === 'offers')) {
                    e.preventDefault();
                    setActiveTab(tab.id);
                    router.push(tab.id === 'home' ? '/' : `/?tab=${tab.id}`);
                  }
                }}
                className={`h-full px-6 flex items-center justify-center border-b-4 transition-all ${
                  isActive
                    ? 'text-primary border-primary font-black scale-105'
                    : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
              </Link>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {tab.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 relative justify-self-end">
        {/* Quick Search Bar / Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setShowFeatureSearch(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/70 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-gray-200/60 dark:border-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-all text-xs font-medium cursor-pointer shadow-2xs group w-36 md:w-44 lg:w-56"
          aria-label={LABELS.NAV.SEARCH}
          title={LABELS.NAV.SEARCH_TOOLTIP}
        >
          <Search size={15} className="text-gray-400 dark:text-slate-500 group-hover:text-primary transition-colors shrink-0" />
          <span className="truncate flex-1 text-left select-none text-[12px]">{LABELS.NAV.SEARCH_PLACEHOLDER}</span>
          <kbd className="hidden lg:inline-flex items-center text-[10px] font-semibold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5 leading-none shadow-2xs">
            {LABELS.NAV.SEARCH_SHORTCUT}
          </kbd>
        </button>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={() => setShowFeatureSearch(true)}
          className="sm:hidden p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary rounded-xl hover:bg-gray-100/60 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
          aria-label={LABELS.NAV.SEARCH}
          title={LABELS.NAV.SEARCH_TOOLTIP}
        >
          <Search size={19} />
        </button>

        <ThemeToggle />

        {user ? (
          <div className="flex items-center gap-3 relative">
            {/* Direct Message Icon */}
            <div className="relative">
              <Button
                onClick={() => setShowChatCenter(!showChatCenter)}
                className="p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors relative focus:outline-none cursor-pointer"
                aria-label="Direct Messages"
                variant="none"
                size="none"
              >
                <MessageCircle size={20} className={unreadMessagesCount > 0 ? 'animate-bounce' : ''} />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors relative focus:outline-none cursor-pointer"
                aria-label={LABELS.NAV.NOTIFICATIONS.TITLE}
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
                    setShowMenu(false);
                    if (setActiveTab) {
                      setActiveTab('settings');
                    }
                    if (typeof window !== 'undefined' && window.location.pathname === '/') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tab', 'settings');
                      window.history.replaceState({}, '', url.toString());
                    } else {
                      router.push('/?tab=settings');
                    }
                  }}
                  onClose={() => setShowMenu(false)}
                />
              </>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" className="rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm">
              <LogIn size={16} className="md:mr-2" />
              <span className="hidden md:inline">{LABELS.AUTH.LOGIN}</span>
            </Button>
          </Link>
        )}
      </div>
    </nav>

    {/* Thanh điều hướng chân trang trên thiết bị di động (Mobile Bottom Navigation) */}
    {!isManagementPage && (
      <nav
        aria-label="Thanh điều hướng di động"
        className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-gray-100 dark:border-slate-900 py-1.5 px-2 safe-area-bottom shadow-lg"
      >
        <div className="flex items-center justify-around">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === '/' && setActiveTab) {
                e.preventDefault();
                setActiveTab('home');
                router.push('/');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
              currentActive === 'home'
                ? 'text-primary font-bold'
                : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
            }`}
          >
            <Home size={20} className={currentActive === 'home' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1 tracking-tight">{LABELS.NAV.HOME}</span>
          </Link>

          <Link
            href="/explore"
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
              currentActive === 'explore'
                ? 'text-primary font-bold'
                : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
            }`}
          >
            <Compass size={20} className={currentActive === 'explore' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1 tracking-tight">{LABELS.NAV.EXPLORE}</span>
          </Link>

          <Link
            href="/?tab=offers"
            onClick={(e) => {
              if (pathname === '/' && setActiveTab) {
                e.preventDefault();
                setActiveTab('offers');
                router.push('/?tab=offers');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
              currentActive === 'offers'
                ? 'text-primary font-bold'
                : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
            }`}
          >
            <Tag size={20} className={currentActive === 'offers' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1 tracking-tight">{LABELS.NAV.OFFERS}</span>
          </Link>

          <Link
            href="/forum"
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
              currentActive === 'forum'
                ? 'text-primary font-bold'
                : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
            }`}
          >
            <MessageSquare size={20} className={currentActive === 'forum' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1 tracking-tight">{LABELS.NAV.FORUM}</span>
          </Link>

          <Link
            href={user ? (isRestaurant ? '/restaurant-admin' : isAdmin ? '/admin' : '/dashboard') : '/login'}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
              ['dashboard', 'profile', 'restaurant-admin', 'admin'].includes(currentActive)
                ? 'text-primary font-bold'
                : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
            }`}
          >
            {user ? (
              <Avatar
                src={user.avatar}
                name={user.name}
                size={20}
                className="ring-1 ring-primary/20"
              />
            ) : (
              <User size={20} />
            )}
            <span className="text-[10px] mt-1 tracking-tight">
              {user ? (LABELS.AUTH?.PROFILE || 'Cá nhân') : LABELS.AUTH.LOGIN}
            </span>
          </Link>
        </div>
      </nav>
    )}

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
    {user && user.id && (
      <ChatCenter
        userId={user.id}
        isOpen={showChatCenter}
        onClose={() => setShowChatCenter(false)}
        onOpen={() => setShowChatCenter(true)}
      />
    )}

    {/* Modal Hộp thoại Tìm kiếm Tính năng & Điều hướng nhanh */}
    <FeatureSearchModal
      isOpen={showFeatureSearch}
      onClose={() => setShowFeatureSearch(false)}
      onSelectTab={setActiveTab}
    />
  </>
);
};
