// Mục đích: Cung cấp và đồng bộ hóa dữ liệu trang quản trị viên như danh sách món ăn, người dùng và đối tác chờ duyệt.
// Ý nghĩa: Đóng vai trò là data-layer của trang admin, gọi dịch vụ API và quản lý state tập trung.
// Chức năng đặc biệt: Tải dữ liệu bất đồng bộ đồng thời qua Promise.all, tự động cập nhật lại state sau khi thực hiện thao tác xóa/sửa.
// Design Pattern: Custom Hook pattern, Service-to-Hook data flow.
// Biến, hàm đặc biệt: useAdminData, fetchData, deleteUser, recommendFood, approveFood.

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin.service';
import { User } from '@/types/user';
import { AdminFoodItem } from '@/types/food';
import { LABELS } from '@/constants/labels';

export const useAdminData = () => {
  const [pendingMerchants, setPendingMerchants] = useState<User[]>([]);
  const [allFoods, setAllFoods] = useState<AdminFoodItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [foods, users, pending] = await Promise.all([
        adminService.getAllFoods(),
        adminService.getAllUsers(),
        adminService.getPendingMerchants()
      ]);
      setAllFoods(foods);
      setAllUsers(users);
      setPendingMerchants(pending);
    } catch (error) {
      console.error(LABELS.UI_MESSAGES.ADMIN.LOAD_ERROR, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const deleteUser = async (id: number) => {
    if (await adminService.deleteUser(id)) {
      await fetchData();
      return true;
    }
    return false;
  };

  const updateStatus = async (userId: number, status: string) => {
    if (await adminService.updateUserStatus(userId, status)) {
      await fetchData();
      return true;
    }
    return false;
  };

  const updateFood = async (foodId: number, data: Partial<AdminFoodItem>) => {
    if (await adminService.updateFood(foodId, data)) {
      await fetchData();
      return true;
    }
    return false;
  };

  const deleteFood = async (id: number) => {
    if (await adminService.deleteFood(id)) {
      await fetchData();
      return true;
    }
    return false;
  };

  const recommendFood = async (id: number) => {
    if (await adminService.recommendFood(id)) {
      await fetchData();
      return true;
    }
    return false;
  };

  const approveFood = async (id: number, status: string) => {
    if (await adminService.approveFood(id, status)) {
      await fetchData();
      return true;
    }
    return false;
  };

  return {
    pendingMerchants,
    allFoods,
    allUsers,
    loading,
    fetchData,
    deleteUser,
    updateStatus,
    updateFood,
    deleteFood,
    recommendFood,
    approveFood
  };
};
