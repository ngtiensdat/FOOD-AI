// Mục đích file này để làm gì: Trang chủ của website FOOD AI, hiển thị Navbar, Hero banner và các danh sách món ăn/nhà hàng.
// Các file khác hay file này có ý nghĩa như nào: Là điểm truy cập đầu tiên của ứng dụng khách hàng, sử dụng các components chung như FoodCard, RestaurantCard, và OnboardingModal.
// Các chức năng đặc biệt: Tải dữ liệu trang chủ kèm định vị vị trí người dùng, xử lý onboarding khảo sát sở thích, thay đổi mật khẩu và quản lý popup chi tiết món ăn.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Container/Presenter Component Pattern, Separation of Concerns (logic đóng gói trong useHomeData và useHomeActions).
// Các biến, hàm đặc biệt trong file: Home component.
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MapPin, Star } from 'lucide-react';
import { User } from '@/types/user';

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
import { FoodCard } from '@/components/features/food/FoodCard';
import { RestaurantCard } from '@/components/features/restaurant/RestaurantCard';
import { FoodDetailModal } from '@/components/features/food/FoodDetailModal';

import { OnboardingModal } from '@/components/features/OnboardingModal';
import { SettingsSection } from '@/components/features/SettingsSection';
import { Footer } from '@/components/features/Footer';

import { LABELS } from '@/constants/labels';

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

  const { nearbyRestaurants, featuredToday, featuredWeekly, recommendedFoods, realFoods } = useHomeData(selectedCity, selectedDistrict);

  // Danh sách các slider hiển thị trên trang chủ
  const sliderSections = [
    {
      id: 'nearby',
      data: nearbyRestaurants,
      title: LABELS.HOME.NEARBY_TITLE,
      subtitle: LABELS.HOME.NEARBY_SUBTITLE,
      icon: <MapPin className="text-blue-500" size={32} />,
      bg: 'blue' as const,
      isRestaurant: true
    },

    {
      id: 'recommended',
      data: recommendedFoods,
      title: LABELS.HOME.RECOMMENDED_TITLE,
      subtitle: LABELS.HOME.RECOMMENDED_SUBTITLE,
      icon: <Sparkles className="text-primary" size={32} />,
      bg: 'orange' as const
    },
    {
      id: 'featuredToday',
      data: featuredToday,
      title: LABELS.HOME.TODAY_TITLE,
      subtitle: LABELS.HOME.TODAY_SUBTITLE,
      icon: <Sparkles className="text-orange-500" size={32} />,
      bg: 'white' as const
    },
    {
      id: 'featuredWeekly',
      data: featuredWeekly,
      title: LABELS.HOME.WEEKLY_TITLE,
      subtitle: LABELS.HOME.WEEKLY_SUBTITLE,
      icon: <Star className="text-blue-500" size={32} />,
      bg: 'gray' as const
    }
    // {
    //   id: 'allFoods',
    //   data: realFoods,
    //   title: LABELS.EXPLORE.TITLE,
    //   subtitle: LABELS.EXPLORE.FOUND_COUNT(realFoods.length),
    //   icon: <ShoppingBag className="text-primary" size={32} />,
    //   bg: 'white' as const
    // }
  ];

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

          {sliderSections.map((section) => (
            section.data.length > 0 && (
              <Slider
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                icon={section.icon}
                bg={section.bg}
              >
                {section.isRestaurant
                  ? section.data.map((restaurant, i) => (
                      <RestaurantCard key={i} restaurant={restaurant} />
                    ))
                  : section.data.map((food, i) => (
                      <FoodCard key={i} food={food} onViewDetail={setSelectedFood} onToggleFavorite={handleToggleFavorite} />
                    ))
                }
              </Slider>
            )
          ))}

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
      ) : (
        <Placeholder onBack={() => setActiveTab('home')} />
      )}

      {selectedFood && <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />}

      {/* Modal hiện onboarding khi user chưa cập nhật sở thích, chỉ hiện 1 lần trong lần đầu tiên login*/}
      {showOnboarding && user && (
        <OnboardingModal user={user as User} onComplete={handleOnboardingComplete} />
      )}

      <Footer />
    </main>
  );
}
