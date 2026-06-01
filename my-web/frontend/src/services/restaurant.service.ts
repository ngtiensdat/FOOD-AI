import { apiClient } from '@/lib/api-client';

export const restaurantService = {
  async getNearbyRestaurants(lat: number, lng: number, radius?: number) {
    return apiClient.get('/restaurants/nearby', {
      params: { lat, lng, radius }
    });
  },

  async getPublicProfile(restaurantId: number) {
    return apiClient.get(`/restaurants/${restaurantId}/public`);
  },


  async getPublicRestaurantFoods(restaurantId: number, categoryId?: number, page: number = 1) {
    return apiClient.get(`/restaurants/${restaurantId}/foods`, {
      params: { categoryId, page }
    });
  },

  async getFollowers(restaurantId: number) {
    return apiClient.get(`/restaurants/${restaurantId}/followers`);
  },

  async getFollowing(restaurantId: number) {
    return apiClient.get(`/restaurants/${restaurantId}/following`);
  },

  async toggleFollow(restaurantId: number) {
    return apiClient.post(`/restaurants/${restaurantId}/follow`);
  },

  async getMyRestaurant() {
    return apiClient.get('/restaurants/my-restaurant');
  },

  async getMyBranches() {
    return apiClient.get('/restaurants/my-branches');
  },

  async updateStatus(isActive: boolean) {
    return apiClient.patch('/restaurants/my-restaurant/status', { isActive });
  },

  async updateProfile(openingHours?: string, contactPhone?: string) {
    return apiClient.patch('/restaurants/my-restaurant/profile', {
      openingHours,
      contactPhone,
    });
  },
};
