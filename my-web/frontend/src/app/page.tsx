'use client';

import React from 'react';
import { Sparkles, MapPin, Star } from 'lucide-react';

// Hooks
import { useHomeData } from '@/hooks/useHomeData';
import { useHomeActions } from '@/hooks/useHomeActions';

// Base Components
import { Slider } from '@/components/base/Slider';
import { Placeholder } from '@/components/base/Placeholder';

// Feature Components
import { Navbar } from '@/components/features/Navbar';
import { Hero } from '@/components/features/Hero';
import { CategorySection } from '@/components/features/CategorySection';
import { FoodCard } from '@/components/features/FoodCard';
import { FoodDetailModal } from '@/components/features/FoodDetailModal';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { SettingsSection } from '@/components/features/SettingsSection';
import { Footer } from '@/components/features/Footer';

import { LABELS } from '@/constants/labels';

export default function Home() {
  const { nearbyFoods, featuredToday, featuredWeekly, recommendedFoods, realFoods } = useHomeData();
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
    handleOnboardingComplete,
    handleAiConsult,
    handleChangePassword,
    handleVerifyEmail,
    fetchUserProfile
  } = useHomeActions();

  // Danh sách các slider hiển thị trên trang chủ
  const sliderSections = [
    {
      id: 'nearby',
      data: nearbyFoods,
      title: LABELS.HOME.NEARBY_TITLE,
      subtitle: LABELS.HOME.NEARBY_SUBTITLE,
      icon: <MapPin className="text-blue-500" size={32} />,
      bg: 'blue' as const
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
    <main className="min-h-screen bg-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
          />

          <CategorySection
            handleCategoryClick={(cat) => window.location.href = `/explore?tag=${encodeURIComponent(cat)}`}
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
                {section.data.map((food, i) => (
                  <FoodCard key={i} food={food} onViewDetail={setSelectedFood} />
                ))}
              </Slider>
            )
          ))}
        </>
      ) : activeTab === 'settings' ? (
        <SettingsSection
          user={user}
          setActiveTab={setActiveTab}
          handleChangePassword={handleChangePassword}
          handleVerifyEmail={handleVerifyEmail}
          fetchUserProfile={fetchUserProfile}
          isEmailVerified={isEmailVerifiedInProfile}
        />
      ) : (
        <Placeholder onBack={() => setActiveTab('home')} />
      )}

      {selectedFood && <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />}

      {/* Modal hiện onboarding khi user chưa cập nhật sở thích, chỉ hiện 1 lần trong lần đầu tiên login*/}
      {showOnboarding && user && (
        <OnboardingModal user={user} onComplete={handleOnboardingComplete} />
      )}

      <Footer />
    </main>
  );
}
