import { apiClient } from '@/lib/api-client';
import { UpdateProfileData, OnboardingData } from '@/types/user';

export const userService = {
  async getProfile(userId: number, requesterId?: number) {
    return apiClient.get(`/user/profile/${userId}`, {
      params: requesterId ? { requesterId } : undefined,
    });
  },

  async updateProfile(data: UpdateProfileData) {
    return apiClient.post('/user/update-profile', data);
  },

  async completeOnboarding(data: OnboardingData) {
    return apiClient.post('/auth/complete-onboarding', data);
  },

  async toggleFollow(followingId: number) {
    return apiClient.post('/user/toggle-follow-user', {
      followingId,
    });
  },
};

