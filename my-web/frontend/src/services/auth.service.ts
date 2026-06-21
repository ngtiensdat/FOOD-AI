// Mục đích: Thực hiện các cuộc gọi API liên quan đến xác thực và quản lý tài khoản người dùng (đăng nhập, đăng ký, đổi mật khẩu, onboarding).
// Ý nghĩa: Đóng vai trò là cổng giao tiếp dịch vụ (Service Layer) chuyên biệt cho phân hệ Auth của ứng dụng frontend.
// Chức năng đặc biệt: Xử lý đăng nhập, đăng ký, đăng xuất, cập nhật hồ sơ, theo dõi người theo dõi (followers/following) và xóa tài khoản.
// Design Pattern: Service pattern, API Client encapsulation.
// Biến, hàm đặc biệt: authService, login, register, completeOnboarding, changePassword.

import { apiClient } from '@/lib/api-client';
import {
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  OnboardingData,
  ChangePasswordData,
} from '@/types/user';

export const authService = {
  async login(credentials: LoginCredentials) {
    return apiClient.post('/auth/login', credentials);
  },

  async register(data: RegisterData) {
    return apiClient.post('/auth/register', data);
  },

  async logout() {
    return apiClient.post('/auth/logout');
  },

  async getProfile(userId: number, requesterId?: number) {
    return apiClient.get(`/user/profile/${userId}`, {
      params: requesterId ? { requesterId } : undefined,
    });
  },

  async updateProfile(data: UpdateProfileData) {
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

  async completeOnboarding(data: OnboardingData) {
    return apiClient.post('/auth/complete-onboarding', data);
  },

  async verifyEmail(data: { email: string }) {
    return apiClient.post('/auth/verify-profile-email', data);
  },

  async verifyEmailOtp(email: string, otp: string) {
    return apiClient.post('/auth/verify-email', { email, otp });
  },

  async resendOtp(email: string) {
    return apiClient.post('/auth/resend-otp', { email });
  },

  async forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: { email: string; otp: string; newPass: string }) {
    return apiClient.post('/auth/reset-password', {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPass,
    });
  },

  async changePassword(data: ChangePasswordData) {
    return apiClient.post('/auth/change-password', data);
  },

  async deleteAccount(data: { password?: string }) {
    return apiClient.delete('/auth/delete-account', { body: data });
  },
};
