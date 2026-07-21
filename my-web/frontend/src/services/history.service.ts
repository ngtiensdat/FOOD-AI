import { apiClient } from '@/lib/api-client';

export interface OrderHistoryItem {
  id: string;
  foodId: number;
  foodName: string;
  quantity: number;
  price: number;
}

export interface OrderHistory {
  id: string;
  orderId: number;
  restaurantId: number;
  tableId: number | null;
  tableName: string | null;
  staffId: number | null;
  staffName: string | null;
  subtotal: number;
  discount: number;
  total: number;
  voucherCode: string | null;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: OrderHistoryItem[];
}

export interface StaffShift {
  id: string;
  staffId: number;
  staffName: string;
  restaurantId: number;
  terminalId: number | null;
  terminalName: string | null;
  clockIn: string;
  clockOut: string | null;
  totalOrders: number;
  totalRevenue: number;
}

export interface DailySalesSummary {
  id: string;
  restaurantId: number;
  date: string;
  totalRevenue: number;
  totalOrders: number;
  cancelledOrders: number;
  cashRevenue: number;
  transferRevenue: number;
  totalDiscount: number;
  createdAt: string;
  updatedAt: string;
}

export const historyService = {
  async getOrderHistories(restaurantId?: number, limit = 100, offset = 0): Promise<OrderHistory[]> {
    const url = restaurantId 
      ? `/history/orders?restaurantId=${restaurantId}&limit=${limit}&offset=${offset}` 
      : `/history/orders?limit=${limit}&offset=${offset}`;
    return apiClient.get(url);
  },

  async getStaffShifts(restaurantId?: number, limit = 100, offset = 0): Promise<StaffShift[]> {
    const url = restaurantId 
      ? `/history/shifts?restaurantId=${restaurantId}&limit=${limit}&offset=${offset}` 
      : `/history/shifts?limit=${limit}&offset=${offset}`;
    return apiClient.get(url);
  },

  async getDailySales(restaurantId?: number, from?: string, to?: string): Promise<DailySalesSummary[]> {
    let url = restaurantId ? `/history/sales?restaurantId=${restaurantId}` : '/history/sales';
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    return apiClient.get(url);
  }
};
