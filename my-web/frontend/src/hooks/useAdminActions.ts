// Mục đích: Quản lý trạng thái và hành động cho trang admin bao gồm người dùng, món ăn, duyệt đối tác.
// Ý nghĩa: Tách biệt hoàn toàn logic nghiệp vụ của quản trị viên khỏi phần UI hiển thị để tối ưu hóa việc bảo trì.
// Chức năng đặc biệt: Cập nhật trạng thái duyệt đối tác, đề xuất món ăn, bật/tắt món ăn nổi bật trong tuần/ngày và cập nhật hàng loạt.
// Design Pattern: Custom Hook pattern, Separation of Concerns (SoC).
// Biến, hàm đặc biệt: useAdminActions, handleUpdateFood, handleBatchUpdate, getFilteredData.

'use client';

import { useState } from 'react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { adminService, FoodBatchUpdateInput } from '@/services/admin.service';
import { UserRole, UserStatus, User } from '@/types/user';
import { AdminFoodItem } from '@/types/food';
import { AdminFoodFormData } from '@/components/features/admin/AdminFoodModal';

export interface UpdateFoodPayload {
  name?: string;
  price?: string | number;
  description?: string;
  image?: string;
  isActive?: boolean;
  isFeaturedToday?: boolean;
  isFeaturedWeekly?: boolean;
  isAdminRecommended?: boolean;
  tags?: string | string[];
}

export interface AdminData {
  pendingMerchants: User[];
  allFoods: AdminFoodItem[];
  allUsers: User[];
  loading: boolean;
  fetchData: () => Promise<void>;
  deleteUser: (_id: number) => Promise<boolean>;
  updateStatus: (_userId: number, _status: string) => Promise<boolean>;
  updateFood: (_foodId: number, _data: Partial<AdminFoodItem>) => Promise<boolean>;
  deleteFood: (_id: number) => Promise<boolean>;
  recommendFood: (_id: number) => Promise<boolean>;
  approveFood: (_id: number, _status: string) => Promise<boolean>;
}

/**
 * Custom Hook: useAdminActions
 * Tách biệt logic xử lý trạng thái và hành động (Actions) của trang Admin.
 * Giúp tệp page.tsx chỉ tập trung vào việc hiển thị giao diện.
 */
export const useAdminActions = (adminData: AdminData) => {
  const { 
    deleteUser, 
    updateStatus, 
    updateFood, 
    deleteFood, 
    recommendFood,
    approveFood,
    pendingMerchants,
    allFoods,
    allUsers,
    fetchData
  } = adminData;

  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'menu' | 'customers' | 'moderation' | 'levels' | 'notifications'>('merchants');
  const [foodSubTab, setFoodSubTab] = useState<'system' | 'merchant'>('merchant');
  const [editingFood, setEditingFood] = useState<AdminFoodItem | null>(null);
  const [editFormData, setEditFormData] = useState<AdminFoodFormData>({
    name: '',
    price: '',
    tags: '',
    image: '',
    description: '',
  });
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
        if (fetchData) fetchData();
      }
    }
    setDeleteUserId(null);
  };

  const handleUpdateStatus = async (userId: number, status: string) => {
    if (await updateStatus(userId, status)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
      if (fetchData) fetchData();
    }
  };

  const handleUpdateFood = async (
    foodId: number, 
    data: UpdateFoodPayload
  ) => {
    // Xử lý chuyển đổi data (tags string -> array, price string -> float) trước khi gọi service
    const processedData: Partial<AdminFoodItem> = {
      name: data.name,
      price: data.price !== undefined ? (typeof data.price === 'string' ? parseFloat(data.price) : data.price) : undefined,
      description: data.description as string | undefined,
      image: data.image as string | undefined,
      isActive: data.isActive as boolean | undefined,
      isFeaturedToday: data.isFeaturedToday as boolean | undefined,
      isAdminRecommended: data.isAdminRecommended as boolean | undefined,
      tags: data.tags !== undefined 
        ? (typeof data.tags === 'string' 
            ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
            : data.tags)
        : undefined,
    };

    if (await updateFood(foodId, processedData)) {
      setEditingFood(null);
      if (data.isFeaturedToday !== undefined) {
        toast.success(data.isFeaturedToday ? LABELS.ADMIN.FEATURE_TODAY_ON : LABELS.ADMIN.FEATURE_TODAY_OFF);
      } else {
        toast.success(LABELS.ADMIN.SAVE_SUCCESS);
      }
      if (fetchData) fetchData();
    }
  };

  const handleDeleteFood = async (id: number) => {
    setDeleteFoodId(id);
  };

  const confirmDeleteFood = async () => {
    if (deleteFoodId) {
      if (await deleteFood(deleteFoodId)) {
        toast.success(LABELS.ADMIN.DELETE_SUCCESS);
        if (fetchData) fetchData();
      }
    }
    setDeleteFoodId(null);
  };

  const handleRecommendFood = async (id: number, newValue: boolean) => {
    if (await recommendFood(id)) {
      toast.success(newValue ? LABELS.ADMIN.RECOMMEND_ON : LABELS.ADMIN.RECOMMEND_OFF);
      if (fetchData) fetchData();
    }
  };

  const handleApproveFood = async (id: number, status: string) => {
    if (await approveFood(id, status)) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
      if (fetchData) fetchData();
    }
  };

  const openEditModal = (food: AdminFoodItem) => {
    setEditingFood(food);
    setEditFormData({ 
      name: food.name || '',
      price: food.price !== undefined ? food.price.toString() : '',
      tags: Array.isArray(food.tags) ? food.tags.join(', ') : '',
      image: (food.image as string) || '',
      description: (food.description as string) || '',
    });
  };

  // --- Logic Lọc dữ liệu (Data Filtering) ---
  const getFilteredMerchants = (): User[] => {
    const query = searchQuery.toLowerCase();
    return pendingMerchants.filter((item: User) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const emailMatch = item.email?.toLowerCase().includes(query);
      return !!(nameMatch || emailMatch);
    });
  };

  const getFilteredUsers = (): User[] => {
    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter((u: User) => u.role === UserRole.RESTAURANT && u.status === UserStatus.APPROVED);
    return filtered.filter((item: User) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const emailMatch = item.email?.toLowerCase().includes(query);
      return !!(nameMatch || emailMatch);
    });
  };

  const getFilteredCustomers = (): User[] => {
    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter((u: User) => u.role === UserRole.CUSTOMER);
    return filtered.filter((item: User) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const emailMatch = item.email?.toLowerCase().includes(query);
      return !!(nameMatch || emailMatch);
    });
  };

  const getFilteredFoods = (): AdminFoodItem[] => {
    const query = searchQuery.toLowerCase();
    let data = foodSubTab === 'system'
      ? allFoods.filter((f: AdminFoodItem) => !f.restaurantId)
      : allFoods.filter((f: AdminFoodItem) => !!f.restaurantId);

    if (foodSubTab === 'merchant') {
      // Create a shallow copy before sorting to avoid mutating the original array directly
      data = [...data].sort((a, b) => {
        const nameA = a.restaurant?.name || '';
        const nameB = b.restaurant?.name || '';
        return nameA.localeCompare(nameB);
      });
    }

    return data.filter((item: AdminFoodItem) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const restaurantMatch = item.restaurant?.name?.toLowerCase().includes(query);
      return !!(nameMatch || restaurantMatch);
    });
  };

  const handleToggleWeeklyFeatured = async (id: number, value: boolean) => {
    const success = await adminService.toggleWeeklyFeatured(id, value);
    if (success) {
      toast.success(value ? LABELS.ADMIN.FEATURE_WEEKLY_ON : LABELS.ADMIN.FEATURE_WEEKLY_OFF);
      if (fetchData) fetchData();
    } else {
      toast.error(LABELS.ADMIN.UPDATE_FAILED);
    }
  };

  const handleBatchUpdate = async (updates: FoodBatchUpdateInput[]) => {
    const success = await adminService.batchUpdateFoods(updates);
    if (success) {
      toast.success(LABELS.ADMIN.SAVE_SUCCESS);
      if (fetchData) fetchData();
      return true;
    } else {
      toast.error(LABELS.ADMIN.UPDATE_FAILED);
      return false;
    }
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
    getFilteredMerchants,
    getFilteredUsers,
    getFilteredCustomers,
    getFilteredFoods,
    actions: {
      handleDeleteUser,
      confirmDeleteUser,
      handleUpdateStatus,
      handleUpdateFood,
      handleDeleteFood,
      confirmDeleteFood,
      handleRecommendFood,
      handleApproveFood,
      openEditModal,
      handleToggleWeeklyFeatured,
      handleBatchUpdate
    }
  };
};
