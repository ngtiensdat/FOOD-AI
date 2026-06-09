// Mục đích file này để làm gì: Component điều phối (Orchestrator) chính của trang quản trị Admin.
// Các file khác hay file này có ý nghĩa như nào: Gọi và hiển thị các bảng dữ liệu con (Food, User, Merchant) dựa trên tab hiện tại được truyền từ Page.
// Các chức năng đặc biệt: Quản lý chuyển đổi tab, điều phối dữ liệu và các thao tác phê duyệt, cập nhật món ăn/nhà hàng.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Container/Presenter Component Pattern, Orchestrator Pattern.
// Các biến, hàm đặc biệt trong file: AdminTable component.
'use client';

import React from 'react';
import { User } from '@/types/user';
import { AdminFoodItem } from '@/types/food';
import { FoodBatchUpdateInput } from '@/services/admin.service';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';
import { LABELS } from '@/constants/labels';
import { AdminMerchantApprovalTable } from './AdminMerchantApprovalTable';
import { AdminUserTable } from './AdminUserTable';
import { AdminSystemFoodTable } from './AdminSystemFoodTable';
import { AdminMerchantFoodTable } from './AdminMerchantFoodTable';

interface AdminTableProps {
  activeTab: 'merchants' | 'users' | 'menu' | 'customers';
  foodSubTab?: 'system' | 'merchant';
  loading: boolean;
  merchants: User[];
  users: User[];
  customers: User[];
  foods: AdminFoodItem[];
  actions: {
    handleUpdateStatus: (id: number, status: string) => void;
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    handleDeleteUser: (id: number) => void;
    openEditModal: (food: AdminFoodItem) => void;
    handleApproveFood?: (id: number, status: string) => void;
    handleToggleWeeklyFeatured?: (id: number, value: boolean) => void;
    handleBatchUpdate?: (updates: FoodBatchUpdateInput[]) => Promise<boolean>;
  };
}

export const AdminTable = ({
  activeTab,
  foodSubTab = 'merchant',
  loading,
  merchants,
  users,
  customers,
  foods,
  actions,
}: AdminTableProps) => {
  const getCurrentDataLength = () => {
    switch (activeTab) {
      case 'merchants':
        return merchants.length;
      case 'users':
        return users.length;
      case 'customers':
        return customers.length;
      case 'menu':
        return foods.length;
      default:
        return 0;
    }
  };

  if (loading && getCurrentDataLength() === 0) {
    return (
      <div className="card-container p-12 text-center text-gray-400 font-bold bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
        {LABELS.COMMON.LOADING}
      </div>
    );
  }

  if (activeTab === 'merchants') {
    return (
      <AdminMerchantApprovalTable
        filteredData={merchants}
        actions={actions}
      />
    );
  }

  if (activeTab === 'users') {
    return (
      <AdminUserTable
        filteredData={users}
        actions={actions}
      />
    );
  }

  if (activeTab === 'customers') {
    return (
      <AdminUserTable
        filteredData={customers}
        actions={actions}
      />
    );
  }

  if (activeTab === 'menu') {
    if (foodSubTab === 'system') {
      return (
        <AdminSystemFoodTable
          filteredData={foods}
          actions={actions}
        />
      );
    } else {
      return (
        <AdminMerchantFoodTable
          filteredData={foods}
          actions={actions}
        />
      );
    }
  }

  return null;
};
