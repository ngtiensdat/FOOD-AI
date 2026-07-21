import { apiClient } from '@/lib/api-client';

export interface PosTerminal {
  id: number;
  name: string;
  code: string;
  restaurantId: number;
  currentUserId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PosTerminalLog {
  id: string;
  terminalId: number;
  userId: number;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_OVERRIDE' | 'CREATE_ORDER' | 'UPDATE_TERMINAL' | 'DELETE_TERMINAL';
  details: string;
  createdAt: string;
  terminal: {
    id: number;
    name: string;
    code: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export const posTerminalService = {
  async getMyPosTerminals(restaurantId: number): Promise<PosTerminal[]> {
    try {
      const response = await apiClient.get(`/pos-terminals/restaurant/${restaurantId}`);
      return response.data || response;
    } catch (err) {
      console.error('Lỗi tải danh sách máy POS:', err);
      return [];
    }
  },

  async createPosTerminal(data: { name: string; code: string; password?: string; restaurantId: number }): Promise<PosTerminal> {
    try {
      const response = await apiClient.post('/pos-terminals', data);
      return response.data || response;
    } catch (err) {
      console.error('Lỗi khi tạo máy POS mới:', err);
      throw err;
    }
  },

  async updatePosTerminal(id: number, data: { name?: string; password?: string; isActive?: boolean }): Promise<PosTerminal> {
    try {
      const response = await apiClient.patch(`/pos-terminals/${id}`, data);
      return response.data || response;
    } catch (err) {
      console.error(`Lỗi khi cập nhật máy POS ${id}:`, err);
      throw err;
    }
  },

  async deletePosTerminal(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/pos-terminals/${id}`);
      return true;
    } catch (err) {
      console.error(`Lỗi khi xóa máy POS ${id}:`, err);
      throw err;
    }
  },

  async getPosTerminalLogs(restaurantId: number): Promise<PosTerminalLog[]> {
    try {
      const response = await apiClient.get(`/pos-terminals/logs/${restaurantId}`);
      return response.data || response;
    } catch (err) {
      console.error('Lỗi tải lịch sử máy POS:', err);
      return [];
    }
  },

  async loginPosTerminal(data: { code: string; password?: string }): Promise<{ id: number; name: string; code: string; restaurantId: number }> {
    try {
      const response = await apiClient.post('/pos-terminals/login', data);
      return response.data || response;
    } catch (err) {
      console.error('Lỗi đăng nhập máy POS:', err);
      throw err;
    }
  },

  async logoutPosTerminal(id: number): Promise<boolean> {
    try {
      await apiClient.post(`/pos-terminals/logout/${id}`);
      return true;
    } catch (err) {
      console.error(`Lỗi đăng xuất máy POS ${id}:`, err);
      return false;
    }
  }
};
