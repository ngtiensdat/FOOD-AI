import { apiClient } from '@/lib/api-client';

export const offerService = {
  async getOffers() {
    return apiClient.get('/offers');
  },

  async createOffer(dto: {
    title: string;
    description: string;
    promoType: string;
    discountValue: string;
    restaurantName: string;
    restaurantId?: number;
    image: string;
    validUntil: string;
  }) {
    return apiClient.post('/offers', dto);
  },

  async deleteOffer(offerId: number) {
    return apiClient.delete(`/offers/${offerId}`);
  },
};
