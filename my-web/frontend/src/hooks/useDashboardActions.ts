'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { foodService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { User } from '@/types/user';
import { Food } from '@/types/food';
import { RecentFoodItem, RecentFoodData } from '@/components/features/food/RecentFoodsList';
import { OnboardingSubmitData } from '@/hooks/useOnboardingActions';

/**
 * Custom Hook: useDashboardActions
 * Quản lý logic lấy thông tin hồ sơ và cập nhật sở thích AI cho người dùng.
 */
export const useDashboardActions = (
  user: Partial<User> | null | undefined,
  updateMe: (user: Partial<User>) => void,
) => {
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [recentViews, setRecentViews] = useState<RecentFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'history'>('profile');
  const [selectedFood, setSelectedFoodState] = useState<Food | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        const [profileData, recentData] = await Promise.all([
          authService.getProfile(user.id) as Promise<User>,
          foodService.getRecentViews(LIMITS.RECENT_VIEWS_HISTORY) as Promise<RecentFoodItem[]>,
        ]);
        setProfile(profileData);
        setRecentViews(recentData);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.id]);

  // Theo dõi khi click xem chi tiết trong dashboard để cập nhật trackView
  useEffect(() => {
    if (selectedFood?.id && user) {
      foodService.trackView(selectedFood.id);
    }
  }, [selectedFood?.id, user]);

  const handleOnboardingComplete = async (onboardingData: OnboardingSubmitData) => {
    if (!profile) return;
    try {
      await authService.completeOnboarding(onboardingData);
      const updatedUser = {
        ...profile,
        hasCompletedOnboarding: true,
      } as Partial<User>;

      // Cập nhật store toàn cục và local state
      updateMe(updatedUser);
      setProfile(updatedUser);

      setShowOnboarding(false);
      toast.success(LABELS.CUSTOMER.SUCCESS_UPDATE);
    } catch (error) {
      console.error('Lỗi hoàn thành onboarding:', error);
      toast.error(LABELS.COMMON.ERROR);
    }
  };

  return {
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
    setSelectedFood: (food: Food | RecentFoodData | null) => setSelectedFoodState(food as Food | null),
  };
};
