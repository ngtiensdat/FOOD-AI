'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { foodService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

/**
 * Custom Hook: useDashboardActions
 * Quản lý logic lấy thông tin hồ sơ và cập nhật sở thích AI cho người dùng.
 */
export const useDashboardActions = (user: any, updateMe: (user: any) => void) => {
  const [profile, setProfile] = useState<any>(null);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        const [profileData, recentData] = await Promise.all([
          authService.getProfile(user.id),
          foodService.getRecentViews()
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

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (!profile) return;
    try {
      await authService.completeOnboarding(onboardingData);
      const updatedUser = { ...profile, hasCompletedOnboarding: true };
      
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
    handleOnboardingComplete
  };
};
