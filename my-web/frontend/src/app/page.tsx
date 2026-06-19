// Mục đích file này để làm gì: Trang chủ của website FOOD AI, hiển thị Navbar, Hero banner và các danh sách món ăn/nhà hàng.
// Các file khác hay file này có ý nghĩa như nào: Là điểm truy cập đầu tiên của ứng dụng khách hàng, sử dụng các components chung như FoodCard, RestaurantCard, và OnboardingModal.
// Các chức năng đặc biệt: Tải dữ liệu trang chủ kèm định vị vị trí người dùng, xử lý onboarding khảo sát sở thích, thay đổi mật khẩu và quản lý popup chi tiết món ăn.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Container/Presenter Component Pattern, Separation of Concerns (logic đóng gói trong useHomeData và useHomeActions).
// Các biến, hàm đặc biệt trong file: Home component.
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MapPin, Star, Flame, TrendingUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/base/Button';
// Hooks
import { useHomeData } from '@/hooks/useHomeData';
import { useHomeActions } from '@/hooks/useHomeActions';

// Base Components
import { Slider } from '@/components/base/Slider';
import { Placeholder } from '@/components/base/Placeholder';

// Feature Components
import { Navbar } from '@/components/features/Navbar';
import { Hero } from '@/components/features/Hero';
import { CategorySection } from '@/components/features/food/CategorySection';
import { FoodCard, FoodCardData } from '@/components/features/food/FoodCard';
import { RestaurantCard } from '@/components/features/restaurant/RestaurantCard';
import { FoodDetailModal } from '@/components/features/food/FoodDetailModal';

import { OnboardingModal } from '@/components/features/OnboardingModal';
import { SettingsSection } from '@/components/features/SettingsSection';
import { OffersSection } from '@/components/features/offers/OffersSection';
import { Footer } from '@/components/features/Footer';

import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { FoodTab } from '@/hooks/useHomeData';

const CATEGORIES = [
  { id: 'recommended' as const, label: LABELS.HOME.TAB_RECOMMENDED, shortLabel: LABELS.HOME.TAB_RECOMMENDED_SHORT, icon: <Sparkles size={16} /> },
  { id: 'today' as const, label: LABELS.HOME.TAB_TODAY, shortLabel: LABELS.HOME.TAB_TODAY_SHORT, icon: <Flame size={16} /> },
  { id: 'weekly' as const, label: LABELS.HOME.TAB_WEEKLY, shortLabel: LABELS.HOME.TAB_WEEKLY_SHORT, icon: <TrendingUp size={16} /> }
];

export default function Home() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    activeTab,
    setActiveTab,
    selectedFood,
    setSelectedFood,
    showOnboarding,
    isEmailVerifiedInProfile,
    aiInput,
    setAiInput,
    aiResponse,
    isAiLoading,
    suggestedFoods,
    selectedCity,
    selectedDistrict,
    setSelectedCity,
    setSelectedDistrict,
    handleOnboardingComplete,
    handleAiConsult,
    handleChangePassword,
    handleVerifyEmail,
    fetchUserProfile,
    handleDeleteAccount,
    handleToggleFavorite
  } = useHomeActions();

  const {
    nearbyRestaurants,
    featuredToday,
    featuredWeekly,
    recommendedFoods,
    isLoading: isLoadingFoods,
    activeFoodTab,
    setActiveFoodTab
  } = useHomeData(selectedCity, selectedDistrict);

  // Lấy danh sách món ăn tương ứng với tab đang active
  const currentFoods = useMemo(() => {
    if (activeFoodTab === 'today') return featuredToday;
    if (activeFoodTab === 'weekly') return featuredWeekly;
    return recommendedFoods;
  }, [activeFoodTab, recommendedFoods, featuredToday, featuredWeekly]);

  // Trạng thái mở rộng cho từng tab món ăn (chỉ hiển thị giới hạn món đầu và nút Xem thêm)
  const [expandedTabs, setExpandedTabs] = useState<Record<FoodTab, boolean>>({
    recommended: false,
    today: false,
    weekly: false
  });

  // Reset trạng thái mở rộng khi đổi địa điểm lọc
  useEffect(() => {
    setExpandedTabs({
      recommended: false,
      today: false,
      weekly: false
    });
  }, [selectedCity, selectedDistrict]);

  const isExpanded = expandedTabs[activeFoodTab];
  const hasMore = currentFoods.length > LIMITS.HOME_FOOD_INITIAL_LIMIT;
  const displayedFoods = useMemo(() => {
    if (isExpanded) return currentFoods;
    return currentFoods.slice(0, LIMITS.HOME_FOOD_INITIAL_LIMIT);
  }, [currentFoods, isExpanded]);

  // Quản lý hiển thị Floating Switcher thông qua IntersectionObserver
  const [showFloating, setShowFloating] = useState(false);
  const tabSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Chỉ hiện floating switcher khi khu vực tab chính không còn trong viewport
        // và người dùng đã cuộn qua khu vực này (boundingClientRect.top < 0)
        const isPast = entry.boundingClientRect.top < 0;
        setShowFloating(!entry.isIntersecting && isPast);
      },
      {
        threshold: 0,
      }
    );

    const currentRef = tabSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <main className="page-container min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={(tab: string) => setActiveTab(tab as 'home' | 'explore' | 'offers' | 'settings')} />

      {activeTab === 'home' ? (
        <>
          <Hero
            aiInput={aiInput}
            setAiInput={setAiInput}
            handleAiConsult={handleAiConsult}
            isAiLoading={isAiLoading}
            aiResponse={aiResponse}
            suggestedFoods={suggestedFoods}
            setSelectedFood={setSelectedFood}
            isAuthenticated={isAuthenticated}
            selectedCity={selectedCity}
            selectedDistrict={selectedDistrict}
            onCityChange={setSelectedCity}
            onDistrictChange={setSelectedDistrict}
          />

          <CategorySection
            handleCategoryClick={(cat: string) => router.push(`/explore?tag=${encodeURIComponent(cat)}`)}
            selectedCategory={null}
          />

          {/* Slider cho Quán ngon quanh đây */}
          {nearbyRestaurants.length > 0 && (
            <Slider
              title={LABELS.HOME.NEARBY_TITLE}
              subtitle={LABELS.HOME.NEARBY_SUBTITLE}
              icon={<MapPin className="text-blue-500" size={32} />}
              bg="blue"
            >
              {nearbyRestaurants.map((restaurant, i) => (
                <RestaurantCard key={i} restaurant={restaurant} />
              ))}
            </Slider>
          )}

          {/* Section danh mục món ăn dạng Tab */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div ref={tabSectionRef} className="border-b border-gray-100 dark:border-slate-800 mb-8">
              <div className="flex space-x-8 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeFoodTab === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => setActiveFoodTab(cat.id)}
                      variant="none"
                      size="none"
                      className={`pb-4 text-base font-bold transition-all relative whitespace-nowrap ${isActive
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                        }`}
                    >
                      {cat.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabLine"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Danh sách món ăn */}
            {isLoadingFoods ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-card overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm animate-pulse flex flex-col h-[195px]">
                    <div className="h-28 bg-gray-200 dark:bg-slate-800" />
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentFoods.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {LABELS.HOME.EMPTY_TAB}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayedFoods.map((food, i) => (
                  <FoodCard
                    key={food.id || i}
                    food={food as unknown as FoodCardData}
                    onViewDetail={setSelectedFood}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}

                {/* Ô thứ 30: Nút Tải thêm món */}
                {!isExpanded && hasMore && (
                  <Button
                    onClick={() => setExpandedTabs(prev => ({ ...prev, [activeFoodTab]: true }))}
                    variant="none"
                    size="none"
                    className="card-premium h-[195px] w-full max-w-[240px] mx-auto flex flex-col items-center justify-center cursor-pointer border border-dashed border-orange-300 dark:border-slate-800 hover:border-primary hover:bg-orange-50/30 dark:hover:bg-slate-900/30 transition-all duration-300 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 relative mb-2 flex items-center justify-center shrink-0"
                    >
                      <img
                        src="/chibi%20linh%20v%E1%BA%ADt/nh%C3%A1y%20m%E1%BA%AFt.png"
                        alt={LABELS.HOME.MASCOT_ALT}
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 group-hover:text-primary transition-colors text-center">
                      {LABELS.HOME.LOAD_MORE}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1">
                      {LABELS.HOME.LOAD_MORE_COUNT(currentFoods.length - LIMITS.HOME_FOOD_INITIAL_LIMIT)}
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'settings' ? (
        <SettingsSection
          user={user}
          setActiveTab={(tab: string) => setActiveTab(tab as 'home' | 'explore' | 'offers' | 'settings')}
          handleChangePassword={handleChangePassword}
          handleVerifyEmail={handleVerifyEmail}
          fetchUserProfile={fetchUserProfile}
          isEmailVerified={isEmailVerifiedInProfile}
          handleDeleteAccount={handleDeleteAccount}
        />
      ) : activeTab === 'offers' ? (
        <OffersSection
          user={user}
          setActiveTab={(tab: string) => setActiveTab(tab as 'home' | 'explore' | 'offers' | 'settings')}
        />
      ) : (
        <Placeholder onBack={() => setActiveTab('home')} />
      )}

      {/* Floating switcher */}
      <AnimatePresence>
        {showFloating && activeTab === 'home' && (
          <>
            {/* Desktop & Tablet: Dọc bên trái */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: '-50%', scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
              exit={{ opacity: 0, x: -30, y: '-50%', scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="hidden md:flex fixed left-4 top-[50%] -translate-y-[50%] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-slate-800/80 p-2 flex-col gap-3"
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeFoodTab === cat.id;
                return (
                  <Button
                    key={cat.id}
                    onClick={() => setActiveFoodTab(cat.id)}
                    variant="none"
                    size="none"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative group z-10 ${isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFloatingDesktopBg"
                        className="absolute inset-0 bg-primary rounded-full shadow-md z-[-1]"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    {cat.icon}

                    {/* Tooltip hiển thị tên danh mục */}
                    <div className="absolute left-12 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {cat.label}
                    </div>
                  </Button>
                );
              })}
            </motion.div>

            {/* Mobile: Ngang ở dưới */}
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="flex md:hidden fixed bottom-4 left-[50%] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-xl border border-gray-100 dark:border-slate-800/80 p-1.5 flex-row gap-1 items-center w-[90%] max-w-[360px]"
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeFoodTab === cat.id;
                return (
                  <Button
                    key={cat.id}
                    onClick={() => setActiveFoodTab(cat.id)}
                    variant="none"
                    size="none"
                    className={`flex-1 py-1.5 px-2.5 rounded-full text-[10px] font-bold transition-colors text-center whitespace-nowrap relative z-10 ${isActive
                      ? 'text-white'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFloatingMobileBg"
                        className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    {cat.shortLabel}
                  </Button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedFood && <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />}

      {/* Modal hiện onboarding khi user chưa cập nhật sở thích, chỉ hiện 1 lần trong lần đầu tiên login*/}
      {showOnboarding && user && (
        <OnboardingModal user={user} onComplete={handleOnboardingComplete} />
      )}

      <Footer />
    </main>
  );
}
