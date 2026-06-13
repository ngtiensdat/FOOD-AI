// Mục đích: Service gọi API quản lý thông báo phía frontend.
// Ý nghĩa: Trọng tâm hóa các endpoint của Notification API (get, markAsRead, markAllAsRead, clearAll).
import { apiClient } from '@/lib/api-client';

export const notificationService = {
  async getNotifications(page?: number, pageSize?: number) {
    return apiClient.get('/notifications', {
      params: {
        ...(page !== undefined && { page }),
        ...(pageSize !== undefined && { pageSize }),
      },
    });
  },

  async markAsRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return apiClient.patch('/notifications/read-all');
  },

  async clearAll() {
    return apiClient.delete('/notifications/clear');
  },
};
