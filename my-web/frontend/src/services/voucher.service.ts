import { apiClient } from '@/lib/api-client';

export interface CreateVoucherInput {
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
  minSpend: string;
  quantity: number;
  expiryDays: number;
  expiryDate?: string | null;
  promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
}

export const voucherService = {
  async getVouchers(restaurantId?: number) {
    const url = restaurantId !== undefined ? `/vouchers?restaurantId=${restaurantId}` : '/vouchers';
    return apiClient.get(url);
  },

  async redeemVoucher(voucherId: string) {
    return apiClient.post(`/vouchers/${voucherId}/redeem`);
  },

  async getMyVouchers() {
    return apiClient.get('/vouchers/my-vouchers');
  },

  async createVoucher(dto: CreateVoucherInput) {
    return apiClient.post('/vouchers', dto);
  },

  async deleteVoucher(voucherId: string) {
    return apiClient.delete(`/vouchers/${voucherId}`);
  },

  async updateVoucher(voucherId: string, dto: Partial<CreateVoucherInput>) {
    return apiClient.patch(`/vouchers/${voucherId}`, dto);
  },

  async generatePointCode(dto: { points: number }) {
    return apiClient.post('/vouchers/point-codes', dto);
  },

  async getPointCodesLogs() {
    return apiClient.get('/vouchers/point-codes/logs');
  },

  async claimPointCode(code: string) {
    return apiClient.post('/vouchers/point-codes/claim', { code });
  },

  async deleteUserVoucher(userVoucherId: string) {
    return apiClient.delete(`/vouchers/my-vouchers/${userVoucherId}`);
  },

  async verifyVoucher(code: string) {
    return apiClient.get(`/vouchers/merchant/verify?code=${code}`);
  },

  async applyVoucher(code: string) {
    return apiClient.post('/vouchers/merchant/apply', { code });
  },
};
