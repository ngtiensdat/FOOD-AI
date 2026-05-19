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
import { LABELS } from '@/constants/labels';

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
    handleOnboardingComplete
  } = useDashboardActions(user, updateMe);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-h2 gradient-text">{LABELS.COMMON.LOADING}</div>;
  if (!user) return null;

  return (
    <div className="admin-layout">
      {/* Sidebar: Điều hướng cá nhân */}
      <Sidebar brandLabel="Food AI">
        <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
        <SidebarItem icon={User} label={LABELS.AUTH.PROFILE} active />
        <SidebarItem icon={Heart} label={LABELS.CUSTOMER.FAVORITES} />
        <SidebarItem icon={Clock} label={LABELS.CUSTOMER.AI_HISTORY} />
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
            <RecentFoodsList items={recentViews} />
          </div>
        </div>
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

    </div>
  );
}
