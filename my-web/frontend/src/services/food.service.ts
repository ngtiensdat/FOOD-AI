const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const foodService = {
  async getAllFoods(tag?: string) {
    const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const res = await fetch(`${API_URL}/foods${query}`);
    return res.ok ? res.json() : [];
  },

  async getFeaturedToday() {
    const res = await fetch(`${API_URL}/foods/featured-today`);
    return res.ok ? res.json() : [];
  },

  async getFeaturedWeekly() {
    const res = await fetch(`${API_URL}/foods/featured-weekly`);
    return res.ok ? res.json() : [];
  },

  async searchFoods(query: string) {
    const res = await fetch(`${API_URL}/foods/search?q=${query}`);
    return res.ok ? res.json() : [];
  },

  async getRecommendedFoods() {
    const res = await fetch(`${API_URL}/foods/recommended`);
    return res.ok ? res.json() : [];
  },
  
  async getNearbyFoods(lat: number, lng: number, radius: number = 5) {
    const res = await fetch(`${API_URL}/foods/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return res.ok ? res.json() : [];
  },

  async getMyFoods() {
    const res = await fetch(`${API_URL}/foods/my-foods`, {
      headers: getAuthHeaders(),
    });
    return res.ok ? res.json() : [];
  },
  
  async createFood(data: any) {
    const res = await fetch(`${API_URL}/foods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.ok;
  },

  async updateFood(id: number, data: any) {
    const res = await fetch(`${API_URL}/foods/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.ok;
  }
};

export const aiService = {
  async chat(userId: number, message: string, lat?: number, lng?: number) {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, message, lat, lng }),
    });
    return res.ok ? res.json() : { reply: '', suggestions: [] };
  }
};

export const adminService = {
  async getAllUsers(role?: string) {
    const query = role ? `?role=${role}` : '';
    const res = await fetch(`${API_URL}/admin/users${query}`, {
      headers: getAuthHeaders(),
    });
    return res.ok ? res.json() : [];
  },

  async deleteUser(id: number) {
    const res = await fetch(`${API_URL}/admin/user/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getAllFoods() {
    const res = await fetch(`${API_URL}/admin/all-foods`, {
      headers: getAuthHeaders(),
    });
    return res.ok ? res.json() : [];
  },

  async updateFood(id: number, data: any) {
    const res = await fetch(`${API_URL}/admin/update-food/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.ok;
  },

  async recommendFood(id: number) {
    const res = await fetch(`${API_URL}/foods/${id}/recommend`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async deleteFood(id: number) {
    const res = await fetch(`${API_URL}/admin/food/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getPendingMerchants() {
    const res = await fetch(`${API_URL}/admin/pending-users`, {
      headers: getAuthHeaders(),
    });
    return res.ok ? res.json() : [];
  },

  async updateUserStatus(userId: number, status: string) {
    const res = await fetch(`${API_URL}/admin/update-status/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  }
};
