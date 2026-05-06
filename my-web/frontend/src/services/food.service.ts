const API_URL = 'http://localhost:3001';

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
  
  async createFood(data: any) {
    const res = await fetch(`${API_URL}/foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  }
};

export const aiService = {
  async chat(userId: number, message: string) {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    });
    return res.ok ? res.json() : { reply: '', suggestions: [] };
  }
};

export const adminService = {
  async getAllUsers(role?: string) {
    const query = role ? `?role=${role}` : '';
    const res = await fetch(`http://localhost:3001/admin/users${query}`);
    return res.ok ? res.json() : [];
  },

  async deleteUser(id: number) {
    const res = await fetch(`http://localhost:3001/admin/user/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async getAllFoods() {
    const res = await fetch(`http://localhost:3001/admin/all-foods`);
    return res.ok ? res.json() : [];
  },

  async updateFood(id: number, data: any) {
    const res = await fetch(`http://localhost:3001/admin/update-food/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  },

  async recommendFood(id: number) {
    const res = await fetch(`${API_URL}/foods/${id}/recommend`, {
      method: 'PATCH',
    });
    return res.ok;
  },

  async deleteFood(id: number) {
    const res = await fetch(`http://localhost:3001/admin/food/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  }
};
