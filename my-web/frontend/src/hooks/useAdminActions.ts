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
    approveFood,
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
  const [deleteFoodId, setDeleteFoodId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  // --- Actions ---

  const handleDeleteUser = async (id: number) => {
    setDeleteUserId(id);
  };

  const confirmDeleteUser = async () => {
    if (deleteUserId) {
      if (await deleteUser(deleteUserId)) {
        toast.success(LABELS.ADMIN.SAVE_SUCCESS);
      }
    }
    setDeleteUserId(null);
  };

  const handleUpdateStatus = async (userId: number, status: string) => {
    if (await updateStatus(userId, status)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const handleUpdateFood = async (foodId: number, data: any) => {
    // Xử lý chuyển đổi data (tags string -> array, price string -> float) trước khi gọi service
    const processedData = { ...data };
    if (data.price !== undefined) {
      processedData.price = parseFloat(data.price);
    }
    if (data.tags !== undefined) {
      processedData.tags = typeof data.tags === 'string' 
        ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        : data.tags;
    }

    if (await updateFood(foodId, processedData)) {
      setEditingFood(null);
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const handleDeleteFood = async (id: number) => {
    setDeleteFoodId(id);
  };

  const confirmDeleteFood = async () => {
    if (deleteFoodId) {
      if (await deleteFood(deleteFoodId)) {
        toast.success(LABELS.ADMIN.DELETE_SUCCESS);
      }
    }
    setDeleteFoodId(null);
  };

  const handleRecommendFood = async (id: number) => {
    if (await recommendFood(id)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
    }
  };

  const handleApproveFood = async (id: number, status: string) => {
    if (await approveFood(id, status)) {
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
    else if (activeTab === 'menu') {
      if (foodSubTab === 'system') {
        data = allFoods.filter((f: any) => !f.restaurantId);
      } else {
        data = allFoods.filter((f: any) => !!f.restaurantId);
        // Sort by restaurant name for grouping
        data.sort((a, b) => {
          const nameA = a.restaurant?.name || '';
          const nameB = b.restaurant?.name || '';
          return nameA.localeCompare(nameB);
        });
      }
    }
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
    deleteFoodId,
    setDeleteFoodId,
    deleteUserId,
    setDeleteUserId,
    getFilteredData,
    actions: {
      handleDeleteUser,
      confirmDeleteUser,
      handleUpdateStatus,
      handleUpdateFood,
      handleDeleteFood,
      confirmDeleteFood,
      handleRecommendFood,
      handleApproveFood,
      openEditModal
    }
  };
};
