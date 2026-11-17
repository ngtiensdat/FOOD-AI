'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Home,
  Compass,
  Tag,
  MessageSquare,
  Sparkles,
  Store,
  Shield,
  Ticket,
  Trophy,
  Settings,
  ArrowRight,
  LogIn,
  ExternalLink,
  Utensils,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { foodService } from '@/services/food.service';
import { formatCurrency } from '@/utils/formatters';
import { SafeImage } from '@/components/base/SafeImage';
import { Food } from '@/types/food';
import { LABELS } from '@/constants/labels';

interface FeatureSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (_tab: string) => void;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'ai' | 'business' | 'personal';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  href: string;
  tabId?: string;
  roles?: ('admin' | 'restaurant' | 'customer' | 'guest')[];
  keywords: string[];
}

export function FeatureSearchModal({ isOpen, onClose, onSelectTab }: FeatureSearchModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live food search state
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input and reset state when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        setFoodResults([]);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Auto scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Master list of all features in Food AI
  const allFeatures: FeatureItem[] = useMemo(() => [
    // Tính năng cốt lõi (Core)
    {
      id: 'home',
      title: 'Trang chủ Food AI',
      description: 'Gợi ý món ăn hôm nay, món trong tuần và các quán ăn nổi bật',
      category: 'core',
      icon: Home,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.MAIN,
      href: '/',
      tabId: 'home',
      keywords: ['trang chu', 'home', 'mon ngon', 'hom nay', 'trong tuan', 'goi y']
    },
    {
      id: 'explore',
      title: 'Khám phá ẩm thực',
      description: 'Tìm kiếm món ăn, lọc quán theo khu vực, thành phố và thể loại ẩm thực',
      category: 'core',
      icon: Compass,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.POPULAR,
      href: '/explore',
      tabId: 'explore',
      keywords: ['kham pha', 'explore', 'tim kiem', 'quan an', 'dia diem', 'mon an']
    },
    {
      id: 'offers',
      title: 'Săn Deal & Khuyến mãi',
      description: 'Tổng hợp các chương trình ưu đãi, mã giảm giá và combo hấp dẫn',
      category: 'core',
      icon: Tag,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.PROMOTION,
      href: '/?tab=offers',
      tabId: 'offers',
      keywords: ['khuyen mai', 'deal', 'giam gia', 'offers', 'combo', 'voucher']
    },
    {
      id: 'forum',
      title: 'Diễn đàn ẩm thực',
      description: 'Mạng xã hội review món ngon, chia sẻ trải nghiệm và tương tác cộng đồng',
      category: 'core',
      icon: MessageSquare,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.COMMUNITY,
      href: '/forum',
      tabId: 'forum',
      keywords: ['dien dan', 'forum', 'bai viet', 'review', 'danh gia', 'cong dong']
    },

    // Trí tuệ nhân tạo (AI)
    {
      id: 'ai-consultant',
      title: 'Trợ lý AI tư vấn món ăn',
      description: 'Chatbot thông minh gợi ý món ăn theo tâm trạng, ngân sách và sở thích cá nhân',
      category: 'ai',
      icon: Sparkles,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.AI,
      href: '/#ai-chat',
      tabId: 'home',
      keywords: ['ai', 'tro ly', 'chat', 'tu van', 'tam trang', 'ngan sach', 'thong minh', 'rag']
    },
    {
      id: 'ai-semantic-search',
      title: 'Tìm kiếm ngữ nghĩa (AI Semantic Search)',
      description: 'Tìm món ăn bằng ngôn ngữ tự nhiên, cảm xúc hoặc nhu cầu dinh dưỡng',
      category: 'ai',
      icon: Search,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.AI,
      href: '/explore',
      tabId: 'explore',
      keywords: ['ngu nghia', 'semantic', 'vector', 'dinh duong', 'suc khoe']
    },

    // Bán hàng & Quản trị (Business)
    {
      id: 'pos',
      title: 'Hệ thống Bán hàng POS',
      description: 'Giao diện bán hàng tại quầy, quản lý đơn đặt và bàn ăn cho quán',
      category: 'business',
      icon: Store,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.MERCHANT,
      href: '/pos',
      keywords: ['pos', 'ban hang', 'thu ngan', 'don hang', 'thanh toan', 'ban an']
    },
    {
      id: 'merchant-hub',
      title: 'Quản trị Quán ăn (Merchant Hub)',
      description: 'Quản lý thực đơn món ăn, danh mục, giờ mở cửa, chi nhánh và doanh thu',
      category: 'business',
      icon: Store,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.MERCHANT,
      href: '/restaurant-admin',
      tabId: 'restaurant-admin',
      roles: ['restaurant', 'admin'],
      keywords: ['quan an', 'merchant', 'thuc don', 'nha hang', 'mon an', 'doanh thu', 'chi nhanh']
    },
    {
      id: 'admin-portal',
      title: 'Quản trị Hệ thống (Admin Portal)',
      description: 'Phê duyệt món ăn, kiểm duyệt nhà hàng, phân quyền tài khoản và danh hiệu',
      category: 'business',
      icon: Shield,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.ADMIN,
      href: '/admin',
      tabId: 'admin',
      roles: ['admin'],
      keywords: ['admin', 'quan tri', 'phe duyet', 'nguoi dung', 'kiem duyet', 'he thong']
    },

    // Tiện ích cá nhân (Personal)
    {
      id: 'vouchers',
      title: 'Ví Voucher & Đổi điểm',
      description: 'Quản lý các mã khuyến mãi đã lưu và đổi điểm thưởng lấy ưu đãi',
      category: 'personal',
      icon: Ticket,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.VOUCHER,
      href: '/vouchers',
      tabId: 'vouchers',
      keywords: ['voucher', 'vi', 'diem thuong', 'doi qua', 'ma giam gia']
    },
    {
      id: 'badges',
      title: 'Cấp độ & Danh hiệu',
      description: 'Theo dõi điểm tích lũy, cấp bậc thành viên và huy hiệu ẩm thực',
      category: 'personal',
      icon: Trophy,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.RANK,
      href: '/badges',
      keywords: ['cap do', 'danh hieu', 'badges', 'huy hieu', 'thu hang', 'level']
    },
    {
      id: 'settings',
      title: 'Cài đặt & Hồ sơ cá nhân',
      description: 'Cập nhật thông tin tài khoản, đổi mật khẩu, thiết lập ngôn ngữ và giao diện',
      category: 'personal',
      icon: Settings,
      badge: LABELS.NAV.QUICK_SEARCH.BADGES.PROFILE,
      href: '/?tab=settings',
      tabId: 'settings',
      keywords: ['cai dat', 'settings', 'ho so', 'mat khau', 'tai khoan', 'profile']
    },
    {
      id: 'auth',
      title: user ? 'Trang cá nhân của bạn' : 'Đăng nhập / Đăng ký',
      description: user ? `Đang đăng nhập với email ${user.email}` : 'Đăng nhập để nhận ưu đãi và trải nghiệm đầy đủ tính năng',
      category: 'personal',
      icon: user ? User : LogIn,
      badge: user ? LABELS.NAV.QUICK_SEARCH.BADGES.PROFILE : LABELS.AUTH.LOGIN,
      href: user ? '/dashboard' : '/login',
      keywords: ['dang nhap', 'dang ky', 'login', 'register', 'auth', 'tai khoan']
    }
  ], [user]);

  // Filter features based on search query and category
  const filteredFeatures = useMemo(() => {
    let list = allFeatures;

    if (activeCategory !== 'all') {
      list = list.filter(item => item.category === activeCategory);
    }

    if (!query.trim()) {
      return list;
    }

    const q = query.toLowerCase().trim();
    return list.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some(k => k.includes(q));
      return matchTitle || matchDesc || matchKeywords;
    });
  }, [allFeatures, activeCategory, query]);

  // Debounced search for food dishes
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      const timer = setTimeout(() => {
        setFoodResults([]);
        setIsLoadingFoods(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsLoadingFoods(true);
      try {
        const res: unknown = await foodService.searchFoods(trimmed);
        const list = Array.isArray(res)
          ? res
          : (res as { data?: Food[] })?.data || [];
        setFoodResults(list.slice(0, 4));
      } catch (err) {
        console.error('Lỗi tìm kiếm món ăn:', err);
        setFoodResults([]);
      } finally {
        setIsLoadingFoods(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Total selectable items count for arrow navigation
  const totalItemsCount = filteredFeatures.length;

  // Handle navigate item
  const handleNavigate = useCallback((item: FeatureItem) => {
    onClose();

    // Special handling for AI consultant on homepage
    if (item.id === 'ai-consultant' && pathname === '/') {
      const el = document.getElementById('ai-chat');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Check if on homepage and it's a tab switch
    if (pathname === '/' && item.tabId && onSelectTab) {
      if (item.tabId === 'home' || item.tabId === 'offers' || item.tabId === 'settings') {
        onSelectTab(item.tabId);
        if (item.tabId === 'home') {
          router.push('/');
        } else {
          router.push(`/?tab=${item.tabId}`);
        }
        return;
      }
    }

    router.push(item.href);
  }, [pathname, onSelectTab, onClose, router]);

  const handleSelectFood = useCallback((food: Food) => {
    onClose();
    if (food.restaurantId) {
      router.push(`/restaurant/${food.restaurantId}`);
    } else {
      router.push(`/explore?q=${encodeURIComponent(food.name)}`);
    }
  }, [onClose, router]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItemsCount) % Math.max(1, totalItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredFeatures[selectedIndex];
      if (selected) {
        handleNavigate(selected);
      } else if (query.trim()) {
        // Navigate to explore with query
        onClose();
        router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filteredFeatures, selectedIndex, totalItemsCount, handleNavigate, query, onClose, router]);

  const categories = useMemo(() => [
    { id: 'all', label: LABELS.NAV.QUICK_SEARCH.CATEGORIES.ALL },
    { id: 'core', label: LABELS.NAV.QUICK_SEARCH.CATEGORIES.CORE },
    { id: 'ai', label: LABELS.NAV.QUICK_SEARCH.CATEGORIES.AI },
    { id: 'business', label: LABELS.NAV.QUICK_SEARCH.CATEGORIES.BUSINESS },
    { id: 'personal', label: LABELS.NAV.QUICK_SEARCH.CATEGORIES.PERSONAL },
  ], []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-6 sm:pt-16 md:pt-24 px-3 sm:px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-colors"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[82vh] z-10"
          >
            {/* Header / Search Input */}
            <div className="relative flex items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-slate-800">
              <Search className="text-primary mr-3 flex-shrink-0" size={22} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={LABELS.NAV.QUICK_SEARCH.INPUT_PLACEHOLDER}
                className="w-full bg-transparent text-sm sm:text-base md:text-lg font-medium text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mr-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 ml-1">
                ESC
              </kbd>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 border-b border-gray-50 dark:border-slate-800/80 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-slate-900/50">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/60 dark:border-slate-700'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable Results List */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[55vh]">
              {/* Features Section */}
              {filteredFeatures.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-3 mb-2">
                    {LABELS.NAV.QUICK_SEARCH.SECTIONS.FEATURES} ({filteredFeatures.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredFeatures.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          data-index={idx}
                          onClick={() => handleNavigate(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${isSelected
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-sm'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 group-hover:text-primary'
                                }`}
                            >
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-800 dark:text-slate-100'
                                  }`}>
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-primary dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 group-hover:text-primary flex-shrink-0 ml-2">
                            <ArrowRight size={16} className={`transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Food Dishes Live Search Section */}
              {query.trim().length >= 2 && (
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-3 mb-2">
                    <span>{LABELS.NAV.QUICK_SEARCH.SECTIONS.FOODS} ({foodResults.length})</span>
                    {isLoadingFoods && <span className="animate-pulse text-primary font-bold">{LABELS.NAV.QUICK_SEARCH.SEARCHING_FOODS}</span>}
                  </div>

                  {foodResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {foodResults.map((food) => (
                        <div
                          key={food.id}
                          onClick={() => handleSelectFood(food)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-primary/40 bg-white dark:bg-slate-800/50 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 cursor-pointer transition-all group"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                            {food.image ? (
                              <SafeImage src={food.image} alt={food.name} fill sizes="48px" className="object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Utensils size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                              {food.name}
                            </h4>
                            <p className="text-[11px] font-extrabold text-primary">
                              {formatCurrency(food.price)}
                            </p>
                            {food.restaurant?.name && (
                              <p className="text-[10px] text-gray-400 truncate">
                                {food.restaurant.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isLoadingFoods ? (
                    <p className="text-xs text-gray-400 px-3 py-1 italic">
                      {LABELS.NAV.QUICK_SEARCH.NO_FOODS_FOUND}
                    </p>
                  ) : null}

                  {/* Direct search jump */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
                    }}
                    className="w-full mt-3 p-3 rounded-2xl bg-orange-50/70 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 text-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{LABELS.NAV.QUICK_SEARCH.EXPLORE_ALL_FOODS(query.trim())}</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              )}

              {/* Empty state when no features match */}
              {filteredFeatures.length === 0 && foodResults.length === 0 && !isLoadingFoods && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Search size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-slate-200">
                    {LABELS.NAV.QUICK_SEARCH.EMPTY_TITLE(query.trim())}
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                    {LABELS.NAV.QUICK_SEARCH.EMPTY_DESC}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
                    }}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors inline-flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span>{LABELS.NAV.QUICK_SEARCH.EXPLORE_BUTTON}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Shortcuts */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/60 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
              <div className="hidden sm:flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold">↑↓</kbd> {LABELS.NAV.QUICK_SEARCH.FOOTER.NAVIGATE}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold">↵</kbd> {LABELS.NAV.QUICK_SEARCH.FOOTER.SELECT}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold">ESC</kbd> {LABELS.NAV.QUICK_SEARCH.FOOTER.CLOSE}
                </span>
              </div>
              <div className="text-right w-full sm:w-auto font-medium">
                {LABELS.NAV.QUICK_SEARCH.FOOTER.TIP}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
