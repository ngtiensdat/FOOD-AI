/**
 * Mục đích file này: Định nghĩa service giao tiếp API các hoạt động khuyến mãi (Offers) cho Merchant & Customer.
 * Các file khác hay file này có ý nghĩa như nào: Cung cấp các phương thức CRUD khuyến mãi và kiểm duyệt phê duyệt qua apiClient.
 * Các chức năng đặc biệt: approveOffer, rejectOffer cho Admin, updateOffer/createOffer cho Merchant.
 */
import { apiClient } from '@/lib/api-client';

export const offerService = {
  async getOffers(restaurantId?: number, status?: string) {
    let url = '/offers';
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', String(restaurantId));
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return apiClient.get(url);
  },

  async createOffer(dto: {
    title: string;
    description: string;
    promoType: string;
    discountValue: string;
    restaurantName?: string;
    restaurantId?: number;
    image: string;
    validUntil: string;
    promoCode?: string;
    terms?: string;
    quantity?: number;
    status?: string;
  }) {
    return apiClient.post('/offers', dto);
  },

  async deleteOffer(offerId: number) {
    return apiClient.delete(`/offers/${offerId}`);
  },

  async updateOffer(
    offerId: number,
    dto: Partial<{
      title: string;
      description: string;
      promoType: string;
      discountValue: string;
      restaurantName: string;
      restaurantId: number;
      image: string;
      validUntil: string;
      promoCode: string;
      terms: string;
      quantity: number;
      status: string;
    }>,
  ) {
    return apiClient.patch(`/offers/${offerId}`, dto);
  },

  async approveOffer(offerId: number) {
    return apiClient.patch(`/offers/${offerId}/approve`);
  },

  async rejectOffer(offerId: number) {
    return apiClient.patch(`/offers/${offerId}/reject`);
  },
};
