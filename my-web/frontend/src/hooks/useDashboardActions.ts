'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

/**
 * Custom Hook: useDashboardActions
 * Quản lý logic lấy thông tin hồ sơ và cập nhật sở thích AI cho người dùng.
 */
export const useDashboardActions = (user: any, updateMe: (user: any) => void) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      try {
        const data = await authService.getProfile(user.id);
        setProfile(data);
      } catch (error) { 
        console.error('Lỗi lấy profile:', error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfileData();
  }, [user?.id]);

  const handleOnboardingComplete = async (preferences: any) => {
    if (!profile) return;
    try {
      await authService.completeOnboarding({ preferences });
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
    loading,
    showOnboarding,
    setShowOnboarding,
    showMenu,
    setShowMenu,
    handleOnboardingComplete
  };
};
