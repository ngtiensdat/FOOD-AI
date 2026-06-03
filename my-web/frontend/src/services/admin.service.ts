// Mục đích: Thực hiện các dịch vụ gọi API dành cho trang quản trị hệ thống (Admin Panel) để quản lý đối tác, món ăn và người dùng.
// Ý nghĩa: Đóng vai trò là Service Layer kết nối frontend với các API endpoint có phân quyền quản trị cao.
// Chức năng đặc biệt: Cập nhật món ăn hàng loạt (batch update), duyệt trạng thái đối tác, nhập danh sách đối tác qua Excel và quản lý món ăn nổi bật tuần.
// Design Pattern: Service pattern, API Client encapsulation.
// Biến, hàm đặc biệt: adminService, batchUpdateFoods, updateUserStatus, importMerchantsExcel, approveFood.

import { apiClient } from '@/lib/api-client';
import { UpdateFoodInput } from '@/types/food';

export interface FoodBatchUpdateInput {
  id: number;
  isFeaturedToday?: boolean;
  isFeaturedWeekly?: boolean;
  isAdminRecommended?: boolean;
}

export const adminService = {
  async getAllUsers(role?: string) {
    return apiClient.get('/admin/users', { params: role ? { role } : undefined }).catch((err) => {
      console.error('Lỗi getAllUsers:', err);
      return [];
    });
  },

  async deleteUser(id: number) {
    try {
      await apiClient.delete(`/admin/user/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getAllFoods() {
    return apiClient.get('/admin/all-foods').catch((err) => {
      console.error('Lỗi getAllFoods:', err);
      return [];
    });
  },

  async updateFood(id: number, data: UpdateFoodInput): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/update-food/${id}`, data);
      return true;
    } catch {
      return false;
    }
  },

  async batchUpdateFoods(updates: FoodBatchUpdateInput[]) {
    try {
      await apiClient.patch('/admin/batch-update-foods', { updates });
      return true;
    } catch {
      return false;
    }
  },

  async recommendFood(id: number) {
    try {
      await apiClient.patch(`/foods/${id}/recommend`);
      return true;
    } catch {
      return false;
    }
  },

  async deleteFood(id: number) {
    try {
      await apiClient.delete(`/admin/food/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getPendingMerchants() {
    return apiClient.get('/admin/pending-users').catch(() => []);
  },

  async updateUserStatus(userId: number, status: string) {
    try {
      await apiClient.patch(`/admin/update-status/${userId}`, { status });
      return true;
    } catch (error) {
      console.error('Failed to update user status', error);
      return false;
    }
  },

  async importMerchantsExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/admin/import-merchants', formData);
  },

  async approveFood(id: number, status: string) {
    try {
      await apiClient.patch(`/foods/${id}/status`, { status });
      return true;
    } catch {
      return false;
    }
  },

  async toggleWeeklyFeatured(id: number, value: boolean) {
    try {
      await apiClient.patch(`/admin/food/${id}/weekly-featured`, { value });
      return true;
    } catch {
      return false;
    }
  }
};
