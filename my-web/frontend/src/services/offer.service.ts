import { apiClient } from '@/lib/api-client';

export const offerService = {
  async getOffers(restaurantId?: number) {
    const url = restaurantId ? `/offers?restaurantId=${restaurantId}` : '/offers';
    return apiClient.get(url);
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
    promoCode?: string;
    terms?: string;
    quantity?: number;
  }) {
    return apiClient.post('/offers', dto);
  },

  async deleteOffer(offerId: number) {
    return apiClient.delete(`/offers/${offerId}`);
  },

  async updateOffer(offerId: number, dto: any) {
    return apiClient.patch(`/offers/${offerId}`, dto);
  },
};
