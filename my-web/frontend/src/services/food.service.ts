// Mục đích: Thực hiện các cuộc gọi API liên quan đến món ăn (Food) bao gồm tìm kiếm, đề xuất, yêu thích và quản lý món ăn.
// Ý nghĩa: Đóng vai trò là Service Layer xử lý toàn bộ logic tương tác dữ liệu món ăn giữa frontend và backend.
// Chức năng đặc biệt: Lấy danh sách món ăn nổi bật (ngày/tuần), món ăn lân cận qua tọa độ GPS, theo dõi lượt xem (trackView) và yêu thích món ăn.
// Design Pattern: Service pattern, API Client encapsulation.
// Biến, hàm đặc biệt: foodService, getNearbyFoods, trackView, createFood, toggleFavorite.
import { apiClient } from '@/lib/api-client';
import { Restaurant, UpdateRestaurantInput } from '@/types/restaurant';
import { CreateFoodInput, UpdateFoodInput, CreateBulkFoodsInput } from '@/types/food';

export const foodService = {
  async getAllFoods(params?: { tag?: string; city?: string; district?: string }) {
    return apiClient.get('/foods', { params }).catch(() => []);
  },

  async getFeaturedToday() {
    return apiClient.get('/foods/featured-today').catch(() => []);
  },

  async getFeaturedWeekly() {
    return apiClient.get('/foods/featured-weekly').catch(() => []);
  },

  async searchFoods(query: string) {
    return apiClient.get('/foods/search', { params: { q: query } }).catch(() => []);
  },

  async getRecommendedFoods() {
    return apiClient.get('/foods/recommended').catch(() => []);
  },

  async getNearbyFoods(lat: number, lng: number, radius: number = 5, city?: string, district?: string) {
    return apiClient.get('/foods/nearby', { params: { lat, lng, radius, city, district } }).catch(() => []);
  },

  async getMyFoods() {
    return apiClient.get('/foods/my-foods').catch((err) => {
      console.error('Error fetching my foods:', err);
      return [];
    });
  },

  async getMyAnalytics() {
    return apiClient.get('/restaurants/my-analytics').catch((err) => {
      console.error('Error fetching my analytics:', err);
      return [];
    });
  },


  async getRecentViews(limit?: number) {
    return apiClient.get('/foods/recent-views', { params: limit ? { limit } : undefined }).catch(() => []);
  },

  async trackView(id: number) {
    try {
      await apiClient.post(`/foods/${id}/view`);
      return true;
    } catch {
      return false;
    }
  },

  async createFood(data: CreateFoodInput): Promise<boolean> {
    try {
      await apiClient.post('/foods', data);
      return true;
    } catch {
      return false;
    }
  },

  async createBulkFoods(data: CreateBulkFoodsInput): Promise<boolean> {
    try {
      await apiClient.post('/foods/bulk', data);
      return true;
    } catch {
      return false;
    }
  },

  async updateFood(id: number, data: UpdateFoodInput): Promise<boolean> {
    try {
      await apiClient.patch(`/foods/${id}`, data);
      return true;
    } catch {
      return false;
    }
  },

  async deleteFood(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/foods/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async toggleFavorite(id: number) {
    try {
      const response = await apiClient.post(`/foods/${id}/favorite`);
      return response.data || response;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return { isFavorite: false };
    }
  }
};
