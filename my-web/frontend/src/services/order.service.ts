import { apiClient } from '@/lib/api-client';

export interface CreateOrderPayload {
  restaurantId: number;
  tableId?: number;
  voucherCode?: string;
  subtotal: number;
  discount: number;
  total: number;
  items: {
    foodId: number;
    quantity: number;
    price: number;
  }[];
}

export const orderService = {
  createOrder: async (payload: CreateOrderPayload) => {
    return apiClient.post('/orders', payload);
  },
  getOrders: async (restaurantId: number) => {
    return apiClient.get(`/orders/restaurant/${restaurantId}`);
  },
  createPaymentLink: async (amount: number, description: string): Promise<any> => {
    return apiClient.post('/orders/payment-link', { amount, description });
  },
  getPaymentLinkStatus: async (orderCode: number): Promise<any> => {
    return apiClient.get(`/orders/payment-link/${orderCode}`);
  },
};
