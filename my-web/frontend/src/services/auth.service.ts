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
    return apiClient.get(`/user/profile/${userId}`, { params: requesterId ? { requesterId } : undefined });
  },

  async updateProfile(data: any) {
    return apiClient.post('/user/update-profile', data);
  },

  async toggleFollowUser(data: { followingId: number }) {
    return apiClient.post('/user/toggle-follow-user', data);
  },

  async getFollowers(userId: number) {
    return apiClient.get(`/user/followers/${userId}`);
  },

  async getFollowing(userId: number) {
    return apiClient.get(`/user/following/${userId}`);
  },

  async completeOnboarding(data: any) {
    return apiClient.post('/auth/complete-onboarding', data);
  },

  async verifyEmail(data: { email: string }) {
    return apiClient.post('/auth/verify-profile-email', data);
  },

  async changePassword(data: any) {
    return apiClient.post('/auth/change-password', data);
  },

  async deleteAccount(data: { password?: string }) {
    return apiClient.post('/auth/delete-account', data);
  },
};
