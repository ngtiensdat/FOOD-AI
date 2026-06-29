/**
 * @fileoverview frontend/src/app/dashboard/page.tsx
 * @module CustomerDashboard
 * @description Trang điều phối (Orchestrator) chính của giao diện Khách hàng. Quản lý việc lắp ráp các tính năng như Hồ sơ, Lịch sử AI, và Món ăn yêu thích. Tách biệt hoàn toàn logic sang `useDashboardActions`.
 */
'use client';

import React from 'react';
import { User, Heart, Clock, ArrowLeft, ChevronDown, Compass, Home, MessageSquare, Tag, Search, Shield, Store } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { Sidebar, SidebarItem, useSidebarCollapse } from '@/components/base/Sidebar';
import { Navbar } from '@/components/features/Navbar';
import { Button } from '@/components/base/Button';
import { UserDropdown } from '@/components/features/UserDropdown';
import { ThemeToggle } from '@/components/base/ThemeToggle';
import { Avatar } from '@/components/base/Avatar';
import { AiSuggestionBanner } from '@/components/features/ai/AiSuggestionBanner';
import { UserProfileDetail } from '@/components/features/profile/UserProfileDetail';
import { RecentFoodsList } from '@/components/features/food/RecentFoodsList';
import { FoodDetailModal, FoodDetailData } from '@/components/features/food/FoodDetailModal';
import { FoodCard, FoodCardData } from '@/components/features/food/FoodCard';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';

export default function CustomerDashboard() {
  const { user, login: updateMe, logout, isAdmin, isRestaurant } = useAuth();

  const [slideDirection, setSlideDirection] = React.useState<'left' | 'right'>('left');
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const prevPath = sessionStorage.getItem('prevPath') || '';
      sessionStorage.setItem('prevPath', '/dashboard');
      if (prevPath) {
        const pathOrder = ['/dashboard', '/restaurant-admin', '/admin'];
        const prevIndex = pathOrder.indexOf(prevPath);
        const currentIndex = pathOrder.indexOf('/dashboard');
        if (prevIndex !== -1 && currentIndex !== -1) {
          setSlideDirection(currentIndex > prevIndex ? 'left' : 'right');
        }
      }
    }
  }, []);

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

  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-h2 gradient-text bg-gray-50 dark:bg-slate-950">{LABELS.COMMON.LOADING}</div>;
  if (!user) return null;

  return (
    <div className="admin-layout flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Main Container under Top Navbar */}
      <div className="flex pt-20 min-h-[calc(100vh-5rem)] w-full">
        {/* Sidebar: Điều hướng cá nhân */}
        <Sidebar 
          showBrand={false} 
          className="top-20 h-[calc(100vh-5rem)] pt-4"
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleCollapse}
        >
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

        {/* Content Area with slide transition */}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'}`}>
          <motion.div
            initial={{ opacity: 0, x: slideDirection === 'left' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            className="w-full h-full"
          >
            {/* Header: Chào hỏi người dùng */}
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{LABELS.CUSTOMER.GREETING(profile?.name || '')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{LABELS.CUSTOMER.SUBTITLE}</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{LABELS.CUSTOMER.RECENT_FOODS}</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">{LABELS.CUSTOMER.RECENT_FOODS_DESC(LIMITS.RECENT_VIEWS_WIDGET)}</p>
                  </div>

                  {recentViews.length === 0 ? (
                    <div className="card-container p-8 text-center text-gray-400 dark:text-slate-500">
                      {LABELS.CUSTOMER.NO_HISTORY}
                    </div>
                  ) : (
                    <div className="grid items-stretch grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentViews
                        .slice(0, LIMITS.RECENT_VIEWS_WIDGET)
                        .filter((item) => !!item.food)
                        .map((item) => (
                          <FoodCard
                            key={item.id}
                            food={item.food as unknown as FoodCardData}
                            onViewDetail={setSelectedFood}
                          />
                        ))}
                    </div>
                  )}
                </div>

                {recentViews.length > LIMITS.RECENT_VIEWS_WIDGET && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{LABELS.CUSTOMER.OLDER_HISTORY}</h2>
                      <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">{LABELS.CUSTOMER.OLDER_HISTORY_DESC(LIMITS.RECENT_VIEWS_HISTORY)}</p>
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
              <div className="card-container p-12 text-center py-20 max-w-4xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
                <Heart size={64} className="mx-auto text-primary/45 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{LABELS.COMMON.DEVELOPING}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-body max-w-md mx-auto">
                  {LABELS.COMMON.DEVELOPING_DESC}
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal Onboarding để cập nhật sở thích */}
      {showOnboarding && profile && (
        <OnboardingModal
          user={profile}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
          title={LABELS.CUSTOMER.UPDATE_PREFERENCES}
        />
      )}

      {selectedFood && (
        <FoodDetailModal
          food={selectedFood as unknown as FoodDetailData}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
}
