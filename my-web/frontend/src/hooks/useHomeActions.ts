'use client';

import { useState, useEffect } from 'react';
import { aiService } from '@/services/food.service';
import { authService as authServiceApi } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

export const useHomeActions = () => {
  const { user, isAuthenticated, isCustomer, login } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('home');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEmailVerifiedInProfile, setIsEmailVerifiedInProfile] = useState<boolean | null>(null);

  // AI Section States
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestedFoods, setSuggestedFoods] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isOnboarded = (user as any).hasCompletedOnboarding === true || 
                          (user as any).profile?.hasCompletedOnboarding === true;
      if (!isOnboarded) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = async (preferences: any) => {
    if (!user || !user.id) return;
    try {
      await authServiceApi.completeOnboarding({ preferences });
      login({ ...user, hasCompletedOnboarding: true });
      setShowOnboarding(false);
      window.location.reload(); 
    } catch (error) {
      console.error('Lỗi hoàn thành onboarding:', error);
    }
  };

  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    if (!user || !isAuthenticated) {
      setAiResponse("Vui lòng đăng nhập để sử dụng tính năng AI tư vấn món ngon bạn nhé! ✨");
      return;
    }
    if (!isCustomer) {
      setAiResponse("Tính năng AI tư vấn hiện chỉ dành cho khách hàng. Cảm ơn bạn!");
      return;
    }

    setAiResponse('');
    setSuggestedFoods([]);
    setIsAiLoading(true);

    try {
      let lat, lng;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition | null>((res) => {
          navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 5000 });
        });
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
      }

      if (user?.id) {
        const aiData = await aiService.chat(aiInput, lat, lng);
        setAiResponse(aiData.reply || '');
        setSuggestedFoods(aiData.suggestions || []);
      }
    } catch (error) {
      console.error('Lỗi AI:', error);
      setAiResponse('Rất tiếc, AI đang bận. Bạn thử lại sau nhé!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent, data: any) => {
    if (!user?.id) return;
    await authServiceApi.changePassword(data);
  };

  const handleVerifyEmail = async (e: React.FormEvent, email: string) => {
    if (!user?.id) return;
    await authServiceApi.verifyEmail({ email });
    setIsEmailVerifiedInProfile(true);
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await authServiceApi.getProfile(user.id);
      setIsEmailVerifiedInProfile(!!profile.isEmailVerified);
    } catch (err) { 
      console.error('Lỗi lấy profile:', err); 
    }
  };

  return {
    user,
    isAuthenticated,
    activeTab,
    setActiveTab,
    selectedFood,
    setSelectedFood,
    showOnboarding,
    setShowOnboarding,
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
  };
};
