import { apiClient } from '@/lib/api-client';

export const foodService = {
  async getAllFoods(tag?: string) {
    return apiClient.get('/foods', { params: tag ? { tag } : undefined }).catch(() => []);
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
  
  async getNearbyFoods(lat: number, lng: number, radius: number = 5) {
    return apiClient.get('/foods/nearby', { params: { lat, lng, radius } }).catch(() => []);
  },

  async getMyFoods() {
    return apiClient.get('/foods/my-foods').catch(() => []);
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
  }
};

export const aiService = {
  async chat(message: string, lat?: number, lng?: number) {
    try {
      return await apiClient.post('/ai/chat', { message, lat, lng });
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
  }
};
