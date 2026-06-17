import { apiClient } from '@/lib/api-client';

export const authService = {
  async login(credentials: any) {
    return apiClient.post('/auth/login', credentials);
  },

  async register(data: any) {
    return apiClient.post('/auth/register', data);
  },

  async logout() {
    return apiClient.post('/auth/logout');
  },

  async getProfile(userId: number, requesterId?: number) {
    return apiClient.get(`/auth/profile/${userId}`, { params: requesterId ? { requesterId } : undefined });
  },

  async updateProfile(data: any) {
    return apiClient.post('/auth/update-profile', data);
  },

  async toggleFollowUser(data: { followingId: number }) {
    return apiClient.post('/auth/toggle-follow-user', data);
  },

  async completeOnboarding(data: { preferences: any }) {
    return apiClient.post('/auth/complete-onboarding', data);
  },

  async verifyEmail(data: { email: string }) {
    return apiClient.post('/auth/verify-profile-email', data);
  },

  async changePassword(data: any) {
    return apiClient.post('/auth/change-password', data);
  }
};
