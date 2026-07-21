import { apiClient } from '@/lib/api-client';

export interface DiningTable {
  id: number;
  name: string;
  restaurantId: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | string;
  capacity: number;
  zone?: string;
  currentGuests?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export const tableService = {
  async getTables(restaurantId: number): Promise<DiningTable[]> {
    return apiClient.get(`/tables?restaurantId=${restaurantId}`);
  },

  async createTable(data: { name: string; restaurantId: number; capacity?: number; zone?: string; note?: string }): Promise<DiningTable> {
    return apiClient.post('/tables', data);
  },

  async bulkCreate(data: {
    prefix: string;
    fromNumber: number;
    toNumber: number;
    capacity: number;
    restaurantId: number;
    zone?: string;
  }): Promise<DiningTable[]> {
    return apiClient.post('/tables/bulk', data);
  },

  async updateTable(
    id: number,
    data: { name?: string; status?: string; capacity?: number; zone?: string; currentGuests?: number; note?: string }
  ): Promise<DiningTable> {
    return apiClient.patch(`/tables/${id}`, data);
  },

  async transferTable(data: {
    fromTableId: number;
    toTableId: number;
  }): Promise<{ fromTable: DiningTable; toTable: DiningTable }> {
    return apiClient.post('/tables/transfer', data);
  },

  async deleteTable(id: number): Promise<{ success: boolean }> {
    return apiClient.delete(`/tables/${id}`);
  },
};
