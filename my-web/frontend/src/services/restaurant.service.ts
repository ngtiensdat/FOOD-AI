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
  }
};
