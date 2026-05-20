'use client';

import React from 'react';
import { User, Heart, Clock, ArrowLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { UserDropdown } from '@/components/features/UserDropdown';
import { AiSuggestionBanner } from '@/components/features/AiSuggestionBanner';
import { UserProfileDetail } from '@/components/features/UserProfileDetail';
import { RecentFoodsList } from '@/components/features/RecentFoodsList';
import { FoodDetailModal } from '@/components/features/FoodDetailModal';
import { FoodCard } from '@/components/features/FoodCard';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';

export default function CustomerDashboard() {
  const { user, login: updateMe, logout } = useAuth();

  // Toàn bộ logic xử lý và trạng thái được quản lý bởi Hook này
  const {
    profile,
    recentViews,
    loading,
    showOnboarding,
    setShowOnboarding,
    showMenu,
    setShowMenu,
    handleOnboardingComplete,
    activeTab,
    setActiveTab,
    selectedFood,
    setSelectedFood
  } = useDashboardActions(user, updateMe);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-h2 gradient-text">{LABELS.COMMON.LOADING}</div>;
  if (!user) return null;

  return (
    <div className="admin-layout">
      {/* Sidebar: Điều hướng cá nhân */}
      <Sidebar brandLabel={LABELS.COMMON.BRAND_NAME}>
        <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
        <SidebarItem 
          icon={User} 
          label={LABELS.AUTH.PROFILE} 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
        />
        <SidebarItem 
          icon={Heart} 
          label={LABELS.CUSTOMER.FAVORITES} 
          active={activeTab === 'favorites'} 
          onClick={() => setActiveTab('favorites')} 
        />
        <SidebarItem 
          icon={Clock} 
          label={LABELS.CUSTOMER.AI_HISTORY} 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
      </Sidebar>

      <main className="admin-main">
        {/* Header: Chào hỏi và Menu người dùng */}
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" className="w-12 h-12 p-0 rounded-2xl shadow-sm">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h2 className="text-h2 text-gray-800">{LABELS.CUSTOMER.GREETING(profile?.name || '')}</h2>
              <p className="text-body text-gray-500">{LABELS.CUSTOMER.SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tái sử dụng UserDropdown để đồng bộ trải nghiệm người dùng toàn ứng dụng */}
            {user && (
              <div className="flex items-center gap-3 relative">
                <div className="text-right hidden md:block">
                  <p className="font-bold text-gray-800">{profile?.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{profile?.role}</p>
                </div>

                <Button
                  variant="outline"
                  className="w-12 h-12 p-0 rounded-2xl shadow-sm"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Menu size={24} />
                </Button>

                {showMenu && (
                  <UserDropdown
                    user={user}
                    onLogout={logout}
                    onSettingsClick={() => setShowMenu(false)}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Banner gợi ý AI nổi bật */}
              <AiSuggestionBanner />

              {/* Thông tin hồ sơ chi tiết */}
              <UserProfileDetail 
                profile={profile} 
                onUpdatePreferences={() => setShowOnboarding(true)} 
              />
            </div>

            <div className="space-y-8">
              <RecentFoodsList 
                items={recentViews.slice(0, LIMITS.RECENT_VIEWS_WIDGET)} 
                onViewDetail={setSelectedFood} 
                onSeeMore={() => setActiveTab('history')}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-12 max-w-5xl">
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{LABELS.CUSTOMER.RECENT_FOODS}</h2>
                <p className="text-gray-500 text-small mt-1">{LABELS.CUSTOMER.RECENT_FOODS_DESC(LIMITS.RECENT_VIEWS_WIDGET)}</p>
              </div>

              {recentViews.length === 0 ? (
                <div className="card-container p-8 text-center text-gray-400">
                  {LABELS.CUSTOMER.NO_HISTORY}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentViews.slice(0, LIMITS.RECENT_VIEWS_WIDGET).map((item) => (
                    <FoodCard key={item.id} food={item.food} onViewDetail={setSelectedFood} />
                  ))}
                </div>
              )}
            </div>

            {recentViews.length > LIMITS.RECENT_VIEWS_WIDGET && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{LABELS.CUSTOMER.OLDER_HISTORY}</h2>
                  <p className="text-gray-500 text-small mt-1">{LABELS.CUSTOMER.OLDER_HISTORY_DESC(LIMITS.RECENT_VIEWS_HISTORY)}</p>
                </div>
                <RecentFoodsList 
                  items={recentViews.slice(LIMITS.RECENT_VIEWS_WIDGET)} 
                  onViewDetail={setSelectedFood} 
                  title={LABELS.CUSTOMER.OLDER_FOODS_TITLE} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="card-container p-12 text-center py-20 max-w-4xl">
            <Heart size={64} className="mx-auto text-primary/45 mb-6 animate-pulse" />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{LABELS.COMMON.DEVELOPING}</h3>
            <p className="text-gray-500 text-body max-w-md mx-auto">
              {LABELS.COMMON.DEVELOPING_DESC}
            </p>
          </div>
        )}
      </main>

      {/* Modal Onboarding để cập nhật sở thích */}
      {showOnboarding && (
        <OnboardingModal
          user={profile}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
          title={LABELS.CUSTOMER.UPDATE_PREFERENCES}
        />
      )}

      {selectedFood && (
        <FoodDetailModal 
          food={selectedFood} 
          onClose={() => setSelectedFood(null)} 
        />
      )}

    </div>
  );
}
