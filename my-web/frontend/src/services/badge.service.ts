import { apiClient } from '@/lib/api-client';

export const badgeService = {
  async getBadges() {
    return apiClient.get('/badges');
  },

  async createBadge(dto: { role: 'CUSTOMER' | 'RESTAURANT'; title: string; points: number }) {
    return apiClient.post('/badges', dto);
  },

  async deleteBadge(id: string) {
    return apiClient.delete(`/badges/${id}`);
  },
};
