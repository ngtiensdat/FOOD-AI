'use client';

import { useState, useEffect } from 'react';
import { aiService, foodService } from '@/services/food.service';
import { authService as authServiceApi } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { LIMITS } from '@/constants/limits.constant';
import { LABELS } from '@/constants/labels';

export const useHomeActions = () => {
  const { user, isAuthenticated, isCustomer, login, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Hà Nội');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('home');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEmailVerifiedInProfile, setIsEmailVerifiedInProfile] = useState<boolean | null>(null);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('');
  };

  // AI Section States
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestedFoods, setSuggestedFoods] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'home' ||
        tabParam === 'explore' ||
        tabParam === 'offers' ||
        tabParam === 'settings'
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isOnboarded = user.hasCompletedOnboarding === true || 
                          user.profile?.hasCompletedOnboarding === true;
      if (!isOnboarded) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedFood?.id && isAuthenticated) {
      foodService.trackView(selectedFood.id);
    }
  }, [selectedFood?.id, isAuthenticated]);

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (!user || !user.id) return;
    try {
      await authServiceApi.completeOnboarding(onboardingData);
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
      setAiResponse(LABELS.CUSTOMER.AI_LOGIN_REQUIRED);
      return;
    }
    if (!isCustomer) {
      setAiResponse(LABELS.CUSTOMER.AI_CUSTOMER_ONLY);
      return;
    }

    setAiResponse('');
    setSuggestedFoods([]);
    setIsAiLoading(true);

    try {
      let lat, lng;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition | null>((res) => {
          navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: LIMITS.GEOLOCATION_TIMEOUT });
        });
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
      }

      if (user?.id) {
        const aiData = await aiService.chat(aiInput, lat, lng, selectedCity, selectedDistrict);
        setAiResponse(aiData.reply || '');
        setSuggestedFoods(aiData.suggestions || []);
      }
    } catch (error) {
      console.error('Lỗi AI:', error);
      setAiResponse(LABELS.COMMON.AI_BUSY);
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

  const handleDeleteAccount = async (password: string) => {
    if (!user?.id) return;
    await authServiceApi.deleteAccount({ password });
    logout();
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
    selectedCity,
    selectedDistrict,
    setSelectedCity: handleCityChange,
    setSelectedDistrict,
    handleOnboardingComplete,
    handleAiConsult,
    handleChangePassword,
    handleVerifyEmail,
    fetchUserProfile,
    handleDeleteAccount
  };
};
