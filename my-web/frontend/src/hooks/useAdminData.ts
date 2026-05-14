import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/food.service';

export const useAdminData = () => {
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
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
      console.error('Lỗi lấy dữ liệu admin:', error);
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

  const updateFood = async (foodId: number, data: any) => {
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
    recommendFood
  };
};
