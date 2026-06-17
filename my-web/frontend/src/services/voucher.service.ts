import { apiClient } from '@/lib/api-client';

export const voucherService = {
  async getVouchers() {
    return apiClient.get('/vouchers');
  },

  async redeemVoucher(voucherId: string) {
    return apiClient.post(`/vouchers/${voucherId}/redeem`);
  },

  async getMyVouchers() {
    return apiClient.get('/vouchers/my-vouchers');
  },
};
