'use client';

import React from 'react';
import { User, Heart, Clock, Settings, Sparkles, ChevronRight, ArrowLeft, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { UserDropdown } from '@/components/features/UserDropdown'; // Tái sử dụng UserDropdown
// Tái sử dụng Alert
import { LABELS } from '@/constants/labels';

export default function CustomerDashboard() {
  const { user, login: updateMe, logout } = useAuth();

  // Toàn bộ logic xử lý và trạng thái được quản lý bởi Hook này
  const {
    profile,
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
            <section className="gradient-bg p-8 rounded-card text-white shadow-2xl shadow-orange-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-h2 !text-white mb-4">{LABELS.CUSTOMER.AI_SUGGESTION}</h3>
                <p className="text-body opacity-90 mb-8 max-w-md">
                  {LABELS.CUSTOMER.AI_SUGGESTION_DESC(LABELS.CUSTOMER.PLACEHOLDER_FOOD)}
                </p>
                <Button variant="secondary" className="px-8 hover:scale-105">{LABELS.RESTAURANT.VIEW_INSIGHT}</Button>
              </div>
              <Sparkles className="absolute right-[-20px] bottom-[-20px] opacity-20" size={180} />
            </section>

            {/* Thông tin hồ sơ chi tiết */}
            <section className="card-container p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-800">{LABELS.CUSTOMER.INFO}</h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowOnboarding(true)}>
                    <Sparkles size={16} className="mr-2" /> {LABELS.CUSTOMER.UPDATE_PREFERENCES}
                  </Button>
                  <Button variant="outline" className="w-10 h-10 p-0 rounded-xl">
                    <Settings size={20} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-small">
                <div>
                  <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">{LABELS.FORM.EMAIL}</label>
                  <p className="font-bold text-gray-700">{profile?.email}</p>
                </div>
                <div>
                  <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">{LABELS.FORM.PHONE}</label>
                  <p className="font-bold text-gray-700">{profile?.profile?.phone || LABELS.FORM.NOT_SET}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">{LABELS.CUSTOMER.AI_CONTEXT}</label>
                  <p className="font-bold text-gray-700 italic">
                    {profile?.profile?.preferences ? Object.values(profile.profile.preferences).join(', ') : LABELS.FORM.NO_PREFERENCES}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Danh sách món ăn xem gần đây */}
            <section className="card-container p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{LABELS.CUSTOMER.RECENT_FOODS}</h3>
              <div className="space-y-4">
                {/* Mock data cho danh sách xem gần đây - Sau này sẽ lấy từ API/Store */}
                {[
                  { id: 1, name: LABELS.CUSTOMER.PLACEHOLDER_FOOD_2, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100', days: 1 },
                  { id: 2, name: LABELS.CUSTOMER.PLACEHOLDER_FOOD, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100', days: 2 }
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                      <Image 
                        src={item.img} 
                        alt={item.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-small group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {LABELS.CUSTOMER.RECENT_FOOD_SUGGEST(item.days)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary" />
                  </div>
                ))}
              </div>
            </section>
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
