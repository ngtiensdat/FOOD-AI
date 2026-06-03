// Mục đích: Quản lý trạng thái và hành động chính ở trang chủ (Home) bao gồm định vị GPS, khảo sát AI, yêu thích món ăn và cài đặt tài khoản.
// Ý nghĩa: Tách biệt logic kinh doanh của trang chủ và hồ sơ người dùng khỏi phần hiển thị giao diện chính.
// Chức năng đặc biệt: Tự động phát hiện vị trí của người dùng bằng GPS, tích hợp tư vấn món ăn qua AI, cập nhật mật khẩu, xác minh email và xóa tài khoản.
// Design Pattern: Custom Hook pattern, Facade pattern (tổng hợp các service).
// Biến, hàm đặc biệt: useHomeActions, handleAiConsult, handleOnboardingComplete, handleToggleFavorite, fetchUserProfile.

'use client';

import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';
import { aiService } from '@/services/ai.service';
import { authService as authServiceApi } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { LIMITS } from '@/constants/limits.constant';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { OnboardingData, ChangePasswordData } from '@/types/user';
import { Food } from '@/types/food';
import { FoodDetailData } from '@/components/features/food/FoodDetailModal';
import { AiSuggestedFood } from '@/components/features/ai/AiResponseBox';

import { useGeolocation } from '@/hooks/useGeolocation';

export const useHomeActions = () => {
  const { user, isAuthenticated, isCustomer, login, logout } = useAuth();
  const { getPosition } = useGeolocation(21.0285, 105.8542);
  const [selectedCity, setSelectedCity] = useState('Hà Nội');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('home');
  const [selectedFood, setSelectedFood] = useState<FoodDetailData | null>(null);
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
  const [suggestedFoods, setSuggestedFoods] = useState<AiSuggestedFood[]>([]);

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
      const foodId = typeof selectedFood.id === 'string' ? parseInt(selectedFood.id, 10) : selectedFood.id;
      if (!isNaN(foodId)) {
        foodService.trackView(foodId);
      }
    }
  }, [selectedFood?.id, isAuthenticated]);

  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
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
      const pos = await getPosition();
      if (pos) { 
        lat = pos.latitude; 
        lng = pos.longitude; 
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

  const handleChangePassword = async (e: React.FormEvent, data: ChangePasswordData) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await authServiceApi.changePassword(data);
      toast.success(LABELS.SETTINGS.SECURITY.CHANGE_SUCCESS);
    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error);
      toast.error(error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent, email: string) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await authServiceApi.verifyEmail({ email });
      setIsEmailVerifiedInProfile(true);
      toast.success(LABELS.SETTINGS.VERIFICATION.SUCCESS);
    } catch (error: any) {
      console.error('Lỗi xác minh email:', error);
      toast.error(error.message || 'Gửi email xác minh thất bại.');
    }
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
    try {
      await authServiceApi.deleteAccount({ password });
      toast.success(LABELS.SETTINGS.DANGER_ZONE.TOAST_SUCCESS);
      logout();
    } catch (error: any) {
      console.error('Lỗi xóa tài khoản:', error);
      toast.error(error.message || LABELS.SETTINGS.DANGER_ZONE.TOAST_ERROR);
    }
  };

  const handleToggleFavorite = async (foodId: number): Promise<boolean> => {
    try {
      const res = await foodService.toggleFavorite(foodId);
      return !!res.isFavorite;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Không thể cập nhật danh sách yêu thích.');
      return false;
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
    selectedCity,
    selectedDistrict,
    setSelectedCity: handleCityChange,
    setSelectedDistrict,
    handleOnboardingComplete,
    handleAiConsult,
    handleChangePassword,
    handleVerifyEmail,
    fetchUserProfile,
    handleDeleteAccount,
    handleToggleFavorite
  };
};
