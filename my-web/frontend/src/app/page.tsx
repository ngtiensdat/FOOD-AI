'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, Send, Smile, DollarSign, MapPin, Navigation, Search,
  Menu, User, Shield, Store, LogOut, X, Settings, Star, Lock, Eye, EyeOff, Mail, ArrowLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { foodService, aiService } from '@/services/food.service';
import { FoodCard } from '@/components/features/FoodCard';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { authService as authServiceApi } from '@/services/auth.service';

export default function Home() {
  const { user, isAuthenticated, isCustomer, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('home');

  // States cho Change Password (Settings)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'verification'>('security');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [isEmailVerifiedInProfile, setIsEmailVerifiedInProfile] = useState<boolean | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // States cho AI Suggestion (Hero section)
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestedFoods, setSuggestedFoods] = useState<any[]>([]);

  // States cho Normal Search (Tên món/quán)
  const [keywordInput, setKeywordInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // States dữ liệu hiển thị
  const [showMenu, setShowMenu] = useState(false);
  const [realFoods, setRealFoods] = useState<any[]>([]);
  const [featuredToday, setFeaturedToday] = useState<any[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<any[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [nearbyFoods, setNearbyFoods] = useState<any[]>([]);

  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      // Kiểm tra kỹ trạng thái onboarding từ nhiều nguồn (phòng trường hợp cấu trúc dữ liệu khác nhau)
      const isOnboarded = user.hasCompletedOnboarding === true || 
                          user.profile?.hasCompletedOnboarding === true;
      
      if (!isOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, [mounted, isAuthenticated, user]);

  const handleOnboardingComplete = async (preferences: any) => {
    if (!user) return;
    try {
      await authServiceApi.completeOnboarding({
        userId: user.id,
        preferences
      });
      
      // Cập nhật local storage và state một cách triệt để
      const updatedUser = { 
        ...user, 
        hasCompletedOnboarding: true,
        profile: {
          ...user.profile,
          hasCompletedOnboarding: true
        }
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowOnboarding(false);
      
      // Thông báo thành công và reload nhẹ hoặc chuyển hướng
      window.location.reload(); 
    } catch (error) {
      console.error('Lỗi hoàn thành onboarding:', error);
    }
  };

  // Refs cho các Slider
  const nearbyRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const weeklyRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: any, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.8; // Cuộn 80% chiều rộng màn hình
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        const [resFoods, resToday, resWeekly, resRecommended] = await Promise.all([
          foodService.getAllFoods(),
          foodService.getFeaturedToday(),
          foodService.getFeaturedWeekly(),
          foodService.getRecommendedFoods()
        ]);
        setRealFoods(resFoods);
        setFeaturedToday(resToday);
        setFeaturedWeekly(resWeekly);
        setRecommendedFoods(resRecommended);

        // Lấy tọa độ người dùng để tìm món gần đây
        if (typeof window !== 'undefined' && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const nearby = await foodService.getNearbyFoods(latitude, longitude);
                setNearbyFoods(nearby);
              } catch (err) {
                console.error('Lỗi lấy món gần đây:', err);
              }
            },
            (error) => {
              console.log('Từ chối hoặc lỗi GPS:', error.message);
            }
          );
        }
      } catch (err) {
        console.error('Lỗi kết nối API:', err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const categories = [
    { name: 'Món nước', icon: '🍜' },
    { name: 'Cơm / Xôi', icon: '🍛' },
    { name: 'Ăn vặt', icon: '🍟' },
    { name: 'Tráng miệng', icon: '🍰' },
    { name: 'Bình dân', icon: '🍚' },
    { name: 'Cao cấp', icon: '🍣' },
  ];

  // 1. Xử lý AI Suggestion (Chỉ dành cho Customer đã đăng nhập)
  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    if (!user || !isAuthenticated) {
      setAiResponse("Vui lòng đăng nhập để sử dụng tính năng AI tư vấn món ngon bạn nhé! ✨");
      return;
    }

    if (!isCustomer) {
      setAiResponse("Tính năng AI tư vấn hiện chỉ dành cho khách hàng. Cảm ơn bạn!");
      return;
    }

    setAiResponse('');
    setSuggestedFoods([]);
    setIsAiLoading(true);

    try {
      // Lấy vị trí người dùng để Geo Search
      let lat: number | undefined;
      let lng: number | undefined;

      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
        });
        if (position) {
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        }
      }

      const aiData = await aiService.chat(user!.id, aiInput, lat, lng);
      setAiResponse(aiData.reply || '');
      setSuggestedFoods(aiData.suggestions || []);
    } catch (error) {
      console.error('Lỗi AI:', error);
      setAiResponse('Rất tiếc, AI đang bận một chút. Bạn thử lại sau nhé!');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 1.5 Xử lý lọc theo Danh mục (Chuyển sang trang Explore)
  const handleCategoryClick = (categoryName: string) => {
    router.push(`/explore?tag=${encodeURIComponent(categoryName)}`);
  };

  // 2. Xử lý Tìm kiếm thường (Món/Quán)
  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;

    setSearchResults([]);
    setIsSearchLoading(true);

    try {
      const searchData = await foodService.searchFoods(keywordInput);
      setSearchResults(searchData);

      // Cuộn xuống phần kết quả
      const resultsSection = document.getElementById('search-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // 3. Xử lý Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setSettingsError('Vui lòng điền đầy đủ các thông tin.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSettingsError('Mật khẩu mới không trùng khớp.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setSettingsError('Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm cả chữ và số.');
      return;
    }

    setIsChangingPassword(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      setSettingsSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setSettingsError(err.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/auth/profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsEmailVerifiedInProfile(!!data.isEmailVerified);
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
    }
  };

  const handleVerifyProfileEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (!verifyEmail.trim()) {
      setSettingsError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setIsVerifyingEmail(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/auth/verify-profile-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, email: verifyEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra khi xác minh email');
      }

      setSettingsSuccess('Xác minh email thành công!');
      setIsEmailVerifiedInProfile(true);
    } catch (err: any) {
      setSettingsError(err.message || 'Lỗi khi xác minh email.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };


  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="Food AI Logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold gradient-text tracking-tight">Food AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('home')}
            className={`pb-1 transition-all ${activeTab === 'home' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
            suppressHydrationWarning
          >
            Trang chủ
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`pb-1 transition-all ${activeTab === 'explore' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
            suppressHydrationWarning
          >
            Khám phá
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`pb-1 transition-all ${activeTab === 'offers' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
            suppressHydrationWarning
          >
            Ưu đãi
          </button>
        </div>

        <div className="flex items-center gap-4 relative">
          <button
            className="p-2 hover:bg-orange-50 rounded-full transition-colors flex items-center gap-2 text-gray-500"
            title="Tìm kiếm chức năng"
            onClick={() => alert('Tính năng tìm kiếm chức năng đang phát triển!')}
            suppressHydrationWarning
          >
            <Search size={20} />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-tighter">Tính năng</span>
          </button>

          {mounted && (
            user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-all flex items-center justify-center bg-gray-100"
                  title="Trang cá nhân"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
                  suppressHydrationWarning
                >
                  <Menu size={24} />
                </button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-50 p-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tài khoản: {user.name}</p>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl transition-all text-sm font-bold text-gray-700">
                        <Shield size={18} className="text-primary" /> Panel Admin
                      </Link>
                    )}
                    {user.role === 'RESTAURANT' && (
                      <Link href="/restaurant-admin" className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl transition-all text-sm font-bold text-gray-700">
                        <Store size={18} className="text-primary" /> Quản lý quán
                      </Link>
                    )}
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl transition-all text-sm font-bold text-gray-700">
                      <User size={18} className="text-primary" /> Dashboard cá nhân
                    </Link>

                    <button
                      onClick={() => { setActiveTab('settings'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl transition-all text-sm font-bold text-gray-700"
                    >
                      <Settings size={18} className="text-primary" /> Cài đặt
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-all text-sm font-bold text-red-500 mt-1 border-t border-gray-50"
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-orange-200 hover:scale-105 transition-all">
                <User size={18} />
                <span>Đăng nhập</span>
              </Link>
            )
          )}
        </div>
      </nav>

      {activeTab === 'home' ? (
        <>
          {/* Hero Section */}
          <section
            className="pt-32 pb-20 px-6 relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.8)), url("https://cdn.24h.com.vn/upload/1-2018/images/2018-01-05/1515110637-529-lam-the-nao-de-chup-anh-do-an-ao-dieu-foodie-collage-1515000125-width660height244.jpg")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                Bạn muốn ăn gì <span className="gradient-text">hôm nay?</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
              >
                Hãy kể cho AI nghe về tâm trạng, ngân sách hoặc sở thích của bạn. Chúng tôi sẽ gợi ý món ăn hoàn hảo nhất ngay gần bạn.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleAiConsult}
                className="glass p-3 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto items-center"
                suppressHydrationWarning
              >
                <div className="flex items-center gap-3 px-4 w-full">
                  <Sparkles className="text-primary shrink-0" size={24} />
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-lg py-2"
                    placeholder={isAuthenticated ? "Hãy kể cho AI nghe bạn muốn ăn gì..." : "Đăng nhập để chat với AI tư vấn..."}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
                <button type="submit" className="w-full md:w-auto gradient-bg text-white px-8 py-4 rounded-xl md:rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg" suppressHydrationWarning>
                  <Send size={20} />
                  <span>Tìm</span>
                </button>
              </motion.form>

              {/* Search Results Area - Hidden here, moved to Menu section */}

              {/* AI Chat Response Area */}
              {(isAiLoading || aiResponse) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 max-w-3xl mx-auto text-left"
                >
                  <div className="glass p-8 rounded-3xl border border-orange-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <img src="/favicon.ico" alt="AI" className="w-10 h-10 object-contain rounded-xl" />
                      <span className="font-bold text-gray-800">Food AI Assistant</span>
                    </div>

                    {isAiLoading ? (
                      <div className="flex gap-2 p-4 italic text-gray-400">
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                        <span>Đang suy nghĩ món ngon cho bạn...</span>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{aiResponse}</p>

                        {suggestedFoods.length > 0 && (
                          <div className="pt-6 border-t border-orange-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Các món ăn gợi ý cho bạn:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {suggestedFoods.map((food, idx) => (
                                <FoodCard 
                                  key={idx} 
                                  food={food} 
                                  onViewDetail={setSelectedFood} 
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {!isAuthenticated && (
                          <div className="mt-4">
                            <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập ngay →</Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center gap-8 mt-10 flex-wrap text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2"><Smile size={18} className="text-orange-400" /> Gợi ý theo tâm trạng</div>
                <div className="flex items-center gap-2"><DollarSign size={18} className="text-orange-400" /> Phù hợp túi tiền</div>
                <div className="flex items-center gap-2"><MapPin size={18} className="text-orange-400" /> Quán ăn gần bạn</div>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Khám phá theo danh mục</h2>

              {/* Thanh tìm kiếm Tag */}
              <div className="max-w-xl mx-auto mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Nhập 1 hoặc nhiều tag cách nhau bởi dấu phẩy bạn nhé!"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary shadow-sm transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCategoryClick((e.target as HTMLInputElement).value);
                    }
                  }}
                  suppressHydrationWarning
                />
              </div>

              {/* Gợi ý Tag (Chưa có icon) */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <span className="text-sm text-gray-400 font-bold mr-2 self-center">Gợi ý:</span>
                {['truyền thống', 'ăn nhanh', 'đồ chiên', 'một mình', 'nhiều người', 'văn phòng', 'cay', 'healthy'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleCategoryClick(t)}
                    className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold hover:bg-orange-100 hover:text-primary transition-all border border-transparent hover:border-orange-200 capitalize"
                    suppressHydrationWarning
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center gap-4 transition-all cursor-pointer group ${selectedCategory === cat.name
                    ? 'bg-primary border-primary text-white shadow-xl shadow-orange-100 scale-105'
                    : 'bg-white border-gray-100 hover:shadow-xl hover:border-orange-200 text-gray-800'
                    }`}
                >
                  <div className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <div className={`font-bold ${selectedCategory === cat.name ? 'text-white' : 'text-gray-800'}`}>{cat.name}</div>
                </motion.div>
              ))}
            </div>
          </section>

          {nearbyFoods.length > 0 && (
            <section className="py-20 px-6 bg-blue-50/30">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      <MapPin className="text-blue-500" size={32} /> Món ngon <span className="gradient-text">Quanh đây</span>
                    </h2>
                    <p className="text-gray-500 text-lg">Khám phá các món ăn hấp dẫn ngay tại vị trí của bạn</p>
                  </div>
                  {/* Nút điều hướng */}
                  <div className="hidden md:flex gap-3">
                    <button
                      onClick={() => scroll(nearbyRef, 'left')}
                      className="w-12 h-12 rounded-full border border-blue-200 bg-white flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => scroll(nearbyRef, 'right')}
                      className="w-12 h-12 rounded-full border border-blue-200 bg-white flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                <div
                  ref={nearbyRef}
                  className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
                >
                  {nearbyFoods.map((food, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[320px] snap-start relative group">
                      <FoodCard food={food} onViewDetail={setSelectedFood} />
                      {food.distance !== undefined && (
                        <a
                          href={food.mapUrl || `https://www.google.com/maps/search/?api=1&query=${food.lat},${food.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 z-10 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                          title="Mở Google Maps dẫn đường"
                        >
                          <Navigation size={12} fill="white" /> {parseFloat(food.distance).toFixed(1)} km
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {featuredToday.length > 0 && (
            <section className="py-20 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      <Sparkles className="text-orange-500" size={32} /> Món ngon <span className="gradient-text">Nổi bật hôm nay</span>
                    </h2>
                    <p className="text-gray-500 text-lg">Những lựa chọn tuyệt vời được tuyển chọn trong ngày</p>
                  </div>
                  <div className="hidden md:flex gap-3">
                    <button
                      onClick={() => scroll(todayRef, 'left')}
                      className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => scroll(todayRef, 'right')}
                      className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                <div
                  ref={todayRef}
                  className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
                >
                  {featuredToday.map((food, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[320px] snap-start">
                      <FoodCard food={food} onViewDetail={setSelectedFood} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {featuredWeekly.length > 0 && (
            <section className="py-20 px-6 bg-gray-50/50">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      <Star className="text-blue-500" size={32} /> Món ngon <span className="gradient-text">Nổi bật tuần qua</span>
                    </h2>
                    <p className="text-gray-500 text-lg">Danh sách các món ăn được cộng đồng yêu thích nhất tuần này</p>
                  </div>
                  <div className="hidden md:flex gap-3">
                    <button
                      onClick={() => scroll(weeklyRef, 'left')}
                      className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => scroll(weeklyRef, 'right')}
                      className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                <div
                  ref={weeklyRef}
                  className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
                >
                  {featuredWeekly.map((food, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[320px] snap-start">
                      <FoodCard food={food} onViewDetail={setSelectedFood} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {recommendedFoods.length > 0 && (
            <section className="py-20 px-6 bg-orange-50/30">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
                      <Sparkles className="text-primary" size={32} /> Món ăn <span className="gradient-text">Được gợi ý</span>
                    </h2>
                    <p className="text-gray-500 text-lg">Các món ngon được chính Admin lựa chọn và đề xuất cho bạn</p>
                  </div>
                  <div className="hidden md:flex gap-3">
                    <button
                      onClick={() => scroll(recommendedRef, 'left')}
                      className="w-12 h-12 rounded-full border border-orange-200 bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => scroll(recommendedRef, 'right')}
                      className="w-12 h-12 rounded-full border border-orange-200 bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
                <div
                  ref={recommendedRef}
                  className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
                >
                  {recommendedFoods.map((food, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[320px] snap-start">
                      <FoodCard food={food} onViewDetail={setSelectedFood} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Modal Chi tiết Món ăn */}
          {selectedFood && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedFood(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row"
              >
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-20 md:text-gray-500 md:bg-gray-100 md:hover:bg-gray-200"
                >
                  <X size={24} />
                </button>

                <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
                  <img
                    src={selectedFood.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    alt={selectedFood.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                  <div className="mb-8">
                    <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-4">
                      {selectedFood.restaurant?.name || selectedFood.restaurantName || 'Hệ thống'}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{selectedFood.name}</h2>
                    <p className="text-2xl font-bold text-primary">{selectedFood.price?.toLocaleString()}đ</p>
                  </div>

                  <div className="space-y-6 mb-10 text-gray-600">
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả món ăn</h4>
                      <p className="leading-relaxed">{selectedFood.description}</p>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group/addr">
                      <MapPin className="text-primary mt-1 shrink-0" size={20} />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">Địa chỉ quán</h4>
                        {selectedFood.mapUrl || selectedFood.map_url ? (
                          <a
                            href={selectedFood.mapUrl || selectedFood.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-medium flex items-center justify-between gap-2"
                          >
                            <span>{selectedFood.address || selectedFood.restaurant?.address || 'Xem vị trí trên bản đồ'}</span>
                            <Navigation size={16} className="text-blue-500 group-hover/addr:scale-125 transition-transform" />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {selectedFood.address || selectedFood.restaurant?.address || 'Chưa cập nhật địa chỉ'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={`/profile?id=${selectedFood.restaurant?.ownerId}`}
                      className="flex-1 gradient-bg text-white py-4 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <Store size={20} /> Trang Quán ăn
                    </Link>
                    <button className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                      <span>Xem các bài đánh giá</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>
      ) : activeTab === 'settings' ? (
        <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 mt-8"
          >
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all mb-6 text-sm"
            >
              <ArrowLeft size={18} /> Quay lại trang chủ
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary text-2xl">
                ⚙️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h2>
                <p className="text-sm text-gray-500">Quản lý thông tin và bảo mật tài khoản của bạn</p>
              </div>
            </div>

            {/* Sub Tabs inside Settings */}
            <div className="flex border-b border-gray-100 mb-8 gap-6 text-sm font-bold text-gray-500">
              <button
                onClick={() => setSettingsTab('profile')}
                className={`pb-3 transition-all flex items-center gap-2 ${settingsTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
                  }`}
              >
                <User size={18} />
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setSettingsTab('security')}
                className={`pb-3 transition-all flex items-center gap-2 ${settingsTab === 'security' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
                  }`}
              >
                <Lock size={18} />
                Bảo mật
              </button>
              <button
                onClick={() => { setSettingsTab('verification'); fetchUserProfile(); }}
                className={`pb-3 transition-all flex items-center gap-2 ${settingsTab === 'verification' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
                  }`}
              >
                <Mail size={18} />
                Xác minh mail
              </button>
            </div>

            {settingsTab === 'profile' ? (
              <div className="space-y-6 max-w-2xl">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <User className="text-primary" size={20} /> Hồ sơ của bạn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold mb-1">Họ và tên</span>
                      <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">{user?.name || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold mb-1">Email</span>
                      <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">{user?.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold transition-all text-sm"
                >
                  Quay lại trang chủ
                </button>
              </div>
            ) : settingsTab === 'security' ? (
              <div className="max-w-2xl">
                {settingsError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-100 font-bold">
                    {settingsError}
                  </div>
                )}

                {settingsSuccess && (
                  <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6 border border-green-100 font-bold">
                    {settingsSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu hiện tại</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        suppressHydrationWarning
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu mới</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        suppressHydrationWarning
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Xác nhận mật khẩu mới</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        suppressHydrationWarning
                      >
                        {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg hover:shadow-orange-200 flex items-center justify-center gap-2"
                    >
                      {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl font-bold transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="max-w-2xl space-y-6">
                {settingsError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-100 font-bold">
                    {settingsError}
                  </div>
                )}

                {settingsSuccess && (
                  <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6 border border-green-100 font-bold">
                    {settingsSuccess}
                  </div>
                )}

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Mail className="text-primary" size={20} /> Xác minh tài khoản email của bạn
                  </h3>
                  {isEmailVerifiedInProfile === true ? (
                    <div className="flex items-center gap-2 bg-green-50 text-green-600 p-4 rounded-xl font-bold border border-green-100">
                      <Shield size={20} className="text-green-500" /> Tài khoản đã được xác minh.
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyProfileEmail} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-semibold ml-1">Nhập email của bạn để xác minh</label>
                        <input
                          type="email"
                          required
                          placeholder="user123@gmail.com"
                          className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm font-medium"
                          value={verifyEmail}
                          onChange={(e) => setVerifyEmail(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifyingEmail}
                        className="w-full bg-primary hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-orange-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        {isVerifyingEmail ? 'Đang xử lý...' : 'Xác minh ngay'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="pt-40 pb-40 px-6 max-w-4xl mx-auto text-center min-h-[60vh] flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-12 rounded-3xl border border-orange-100 shadow-xl max-w-lg"
          >
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-primary mx-auto mb-6 text-3xl">
              🚧
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Tính năng đang phát triển</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Chúng tôi đang phát triển tính năng này để mang đến trải nghiệm tốt nhất cho bạn. Vui lòng quay lại sau nhé! ✨
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="gradient-bg text-white px-8 py-3.5 rounded-full font-bold hover:scale-105 transition-all shadow-md"
            >
              Quay lại trang chủ
            </button>
          </motion.div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal 
          user={user} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Food AI Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold gradient-text">Food AI</span>
          </div>
          <div className="flex gap-8 text-gray-500 text-sm">
            <a href="#" className="hover:text-primary">Quy định</a>
            <a href="#" className="hover:text-primary">Chính sách</a>
            <a href="#" className="hover:text-primary">Liên hệ</a>
          </div>
          <p className="text-gray-400 text-sm">© 2026 Food AI Team. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
