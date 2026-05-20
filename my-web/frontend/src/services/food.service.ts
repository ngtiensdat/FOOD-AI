import { apiClient } from '@/lib/api-client';

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
    return apiClient.get('/foods/my-foods').catch(() => []);
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

  async createFood(data: any) {
    try {
      await apiClient.post('/foods', data);
      return true;
    } catch {
      return false;
    }
  },

  async updateFood(id: number, data: any) {
    try {
      await apiClient.patch(`/foods/${id}`, data);
      return true;
    } catch {
      return false;
    }
  },

  async deleteFood(id: number) {
    try {
      await apiClient.delete(`/foods/${id}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const aiService = {
  async chat(message: string, lat?: number, lng?: number, city?: string, district?: string) {
    try {
      return await apiClient.post('/ai/chat', { message, lat, lng, city, district });
    } catch {
      return { reply: '', suggestions: [] };
    }
  }
};

export const adminService = {
  async getAllUsers(role?: string) {
    return apiClient.get('/admin/users', { params: role ? { role } : undefined }).catch(() => []);
  },

  async deleteUser(id: number) {
    try {
      await apiClient.delete(`/admin/user/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getAllFoods() {
    return apiClient.get('/admin/all-foods').catch(() => []);
  },

  async updateFood(id: number, data: any) {
    try {
      await apiClient.patch(`/admin/update-food/${id}`, data);
      return true;
    } catch {
      return false;
    }
  },

  async recommendFood(id: number) {
    try {
      await apiClient.patch(`/foods/${id}/recommend`);
      return true;
    } catch {
      return false;
    }
  },

  async deleteFood(id: number) {
    try {
      await apiClient.delete(`/admin/food/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getPendingMerchants() {
    return apiClient.get('/admin/pending-users').catch(() => []);
  },

  async updateUserStatus(userId: number, status: string) {
    try {
      await apiClient.patch(`/admin/update-status/${userId}`, { status });
      return true;
    } catch {
      return false;
    }
  },

  async approveFood(id: number, status: string) {
    try {
      await apiClient.patch(`/foods/${id}/status`, { status });
      return true;
    } catch {
      return false;
    }
  }
};

export const restaurantService = {
  async getMyRestaurant() {
    return apiClient.get('/restaurants/my-restaurant').catch(() => null);
  },

  async getMyBranches() {
    return apiClient.get('/restaurants/my-branches').catch(() => []);
  },

  async updateRestaurantStatus(isActive: boolean) {
    try {
      await apiClient.patch('/restaurants/my-restaurant/status', { isActive });
      return true;
    } catch {
      return false;
    }
  },

  async updateRestaurantProfile(data: { openingHours?: string; contactPhone?: string }) {
    try {
      await apiClient.patch('/restaurants/my-restaurant/profile', data);
      return true;
    } catch {
      return false;
    }
  }
};

