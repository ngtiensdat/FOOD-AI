// Mục đích: Thực hiện các cuộc gọi API liên quan đến Nhà hàng (Restaurant) bao gồm thông tin hồ sơ, chi nhánh và theo dõi (follow).
// Ý nghĩa: Đóng vai trò là Service Layer kết nối frontend với các API quản lý và hiển thị thông tin nhà hàng.
// Chức năng đặc biệt: Cập nhật trạng thái mở/đóng cửa của nhà hàng, lấy danh sách chi nhánh, định vị nhà hàng lân cận và lấy thực đơn công khai.
// Design Pattern: Service pattern, API Client encapsulation.
// Biến, hàm đặc biệt: restaurantService, getMyRestaurant, getPublicRestaurants, toggleFollow, getPublicRestaurantFoods.

import { apiClient } from '@/lib/api-client';
import { Restaurant, UpdateRestaurantInput } from '@/types/restaurant';

export const restaurantService = {
  async getMyRestaurant() {
    return apiClient.get('/restaurants/my-restaurant').catch((err) => {
      console.error('Error fetching my restaurant:', err);
      return null;
    });
  },

  async getMyBranches() {
    return apiClient.get('/restaurants/my-branches').catch((err) => {
      console.error('Error fetching my branches:', err);
      return [];
    });
  },

  async updateRestaurantStatus(isActive: boolean) {
    try {
      await apiClient.patch('/restaurants/my-restaurant/status', { isActive });
      return true;
    } catch {
      return false;
    }
  },

  async updateRestaurantProfile(data: UpdateRestaurantInput): Promise<boolean> {
    try {
      await apiClient.patch('/restaurants/my-restaurant/profile', data);
      return true;
    } catch {
      return false;
    }
  },

  async getPublicRestaurants(params?: {
    search?: string;
    city?: string;
    district?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Restaurant[]; total: number }> {
    return apiClient
      .get('/restaurants', { params })
      .catch(() => ({ data: [], total: 0 }));
  },

  async getNearbyRestaurants(lat: number, lng: number, radius?: number) {
    try {
      const response = await apiClient.get('/restaurants/nearby', {
        params: { lat, lng, radius }
      });
      return response.data || response;
    } catch (err) {
      console.error('Error getting nearby restaurants:', err);
      return [];
    }
  },

  async getPublicProfile(restaurantId: number) {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/public`);
      return response.data || response;
    } catch (err) {
      console.error('Error getting public profile:', err);
      return null;
    }
  },

  async getPublicRestaurantFoods(restaurantId: number, categoryId?: number, page: number = 1, pageSize?: number) {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/foods`, {
        params: { categoryId, page, pageSize }
      });
      return response.data || response;
    } catch (err) {
      console.error('Error getting public restaurant foods:', err);
      return { items: [], total: 0, page, pageSize: pageSize || 8 };
    }
  },

  async toggleFollow(restaurantId: number) {
    try {
      const response = await apiClient.post(`/restaurants/${restaurantId}/follow`);
      return response.data || response;
    } catch (err) {
      console.error('Error toggling follow:', err);
      throw err;
    }
  },

  async getFollowers(restaurantId: number) {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/followers`);
      return response.data || response;
    } catch (err) {
      console.error('Error getting restaurant followers:', err);
      return [];
    }
  },

  async getFollowing(restaurantId: number) {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/following`);
      return response.data || response;
    } catch (err) {
      console.error('Error getting merchant following:', err);
      return [];
    }
  },

  async getMyStaffs() {
    try {
      const response = await apiClient.get('/restaurants/my-restaurant/staffs');
      return response.data || response;
    } catch (err) {
      console.error('Error fetching staffs:', err);
      return [];
    }
  },

  async inviteStaff(data: { email: string; restaurantId: number }) {
    try {
      const response = await apiClient.post('/restaurants/my-restaurant/staffs/invite', data);
      return response.data || response;
    } catch (err) {
      console.error('Error inviting staff:', err);
      throw err;
    }
  },

  async updateStaff(staffId: string | number, data: any) {
    try {
      const response = await apiClient.patch(`/restaurants/my-restaurant/staffs/${staffId}`, data);
      return response.data || response;
    } catch (err) {
      console.error('Error updating staff:', err);
      throw err;
    }
  },

  async deleteStaff(staffId: string | number) {
    try {
      const response = await apiClient.delete(`/restaurants/my-restaurant/staffs/${staffId}`);
      return response.data || response;
    } catch (err) {
      console.error('Error removing staff member:', err);
      throw err;
    }
  },

  async getStaffInvitations() {
    try {
      const response = await apiClient.get('/restaurants/my-restaurant/staff-invitations');
      return response.data || response;
    } catch (err) {
      console.error('Error fetching staff invitations:', err);
      return [];
    }
  },

  async revokeInvitation(invitationId: string) {
    try {
      const response = await apiClient.delete(`/restaurants/my-restaurant/staff-invitations/${invitationId}`);
      return response.data || response;
    } catch (err) {
      console.error('Error revoking staff invitation:', err);
      throw err;
    }
  },

  async getStaffHistories() {
    try {
      const response = await apiClient.get('/restaurants/my-restaurant/staff-histories');
      return response.data || response;
    } catch (err) {
      console.error('Error fetching staff histories:', err);
      return [];
    }
  },

  async getStaffReviews() {
    try {
      const response = await apiClient.get('/restaurants/my-restaurant/staff-reviews');
      return response.data || response;
    } catch (err) {
      console.error('Error fetching staff reviews:', err);
      return [];
    }
  },

  async createStaffReview(staffId: string | number, rating: number, feedback?: string) {
    try {
      const response = await apiClient.post(`/restaurants/my-restaurant/staffs/${staffId}/reviews`, { rating, feedback });
      return response.data || response;
    } catch (err) {
      console.error('Error creating staff review:', err);
      throw err;
    }
  },

  async getUserJobInvitations() {
    try {
      const response = await apiClient.get('/restaurants/user/job-invitations');
      return response.data || response;
    } catch (err) {
      console.error('Error fetching user job invitations:', err);
      return [];
    }
  },

  async respondToJobInvitation(invitationId: string, accept: boolean) {
    try {
      const response = await apiClient.post(`/restaurants/user/job-invitations/${invitationId}/respond`, { accept });
      return response.data || response;
    } catch (err) {
      console.error('Error responding to job invitation:', err);
      throw err;
    }
  },

  async resignStaff() {
    try {
      const response = await apiClient.post('/restaurants/user/resign');
      return response.data || response;
    } catch (err) {
      console.error('Error resigning staff member:', err);
      throw err;
    }
  }
};
