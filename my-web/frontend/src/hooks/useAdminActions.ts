'use client';

import { useState } from 'react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

/**
 * Custom Hook: useAdminActions
 * Tách biệt logic xử lý trạng thái và hành động (Actions) của trang Admin.
 * Giúp tệp page.tsx chỉ tập trung vào việc hiển thị giao diện.
 */
export const useAdminActions = (adminData: any) => {
  const { 
    deleteUser, 
    updateStatus, 
    updateFood, 
    deleteFood, 
    recommendFood,
    pendingMerchants,
    allFoods,
    allUsers
  } = adminData;

  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'menu' | 'customers'>('merchants');
  const [foodSubTab, setFoodSubTab] = useState<'system' | 'merchant'>('system');
  const [editingFood, setEditingFood] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // --- Actions ---

  const handleDeleteUser = async (id: number) => {
    if (confirm(LABELS.ADMIN.CONFIRM.DELETE_USER)) {
      await deleteUser(id);
    }
  };

  const handleUpdateStatus = async (userId: number, status: string) => {
    if (await updateStatus(userId, status)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const handleUpdateFood = async (foodId: number, data: any) => {
    // Xử lý chuyển đổi data (tags string -> array, price string -> float) trước khi gọi service
    const processedData = {
      ...data,
      price: parseFloat(data.price),
      tags: typeof data.tags === 'string' 
        ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        : data.tags
    };

    if (await updateFood(foodId, processedData)) {
      setEditingFood(null);
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const handleDeleteFood = async (id: number) => {
    if (confirm(LABELS.ADMIN.CONFIRM.DELETE_FOOD)) {
      if (await deleteFood(id)) {
        toast.success(LABELS.ADMIN.DELETE_SUCCESS);
      }
    }
  };

  const handleRecommendFood = async (id: number) => {
    if (await recommendFood(id)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const openEditModal = (food: any) => {
    setEditingFood(food);
    setEditFormData({ 
      ...food, 
      tags: food.tags?.join(', ') || '' 
    });
  };

  // --- Logic Lọc dữ liệu (Data Filtering) ---
  const getFilteredData = () => {
    let data: any[] = [];
    if (activeTab === 'merchants') data = pendingMerchants;
    else if (activeTab === 'menu') data = allFoods.filter((f: any) => foodSubTab === 'system' ? !f.restaurantId : !!f.restaurantId);
    else if (activeTab === 'users') data = allUsers.filter((u: any) => u.role === 'RESTAURANT' && u.status === 'APPROVED');
    else if (activeTab === 'customers') data = allUsers.filter((u: any) => u.role === 'CUSTOMER');

    return data.filter((item: any) =>
      (item.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return {
    activeTab,
    setActiveTab,
    foodSubTab,
    setFoodSubTab,
    editingFood,
    setEditingFood,
    editFormData,
    setEditFormData,
    searchQuery,
    setSearchQuery,
    showMenu,
    setShowMenu,
    getFilteredData,
    actions: {
      handleDeleteUser,
      handleUpdateStatus,
      handleUpdateFood,
      handleDeleteFood,
      handleRecommendFood,
      openEditModal
    }
  };
};
