'use client';

// Mục đích file: Component điều phối (Orchestrator) chính của trang quản trị.
// Ý nghĩa: Gọi và hiển thị các bảng dữ liệu con (Food, User, Merchant) dựa trên tab hiện tại.
// Các chức năng đặc biệt: Quản lý state tab, gọi các component bảng con tương ứng.
// Các biến, hàm đặc biệt: AdminTable (component chính), AdminTableItem (kiểu dữ liệu).

import React from 'react';
import { UserStatus } from '@/types/user';
import { FoodBatchUpdateInput } from '@/services/food.service';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';
import { LABELS } from '@/constants/labels';
import { AdminMerchantApprovalTable } from './AdminMerchantApprovalTable';
import { AdminUserTable } from './AdminUserTable';
import { AdminSystemFoodTable } from './AdminSystemFoodTable';
import { AdminMerchantFoodTable } from './AdminMerchantFoodTable';

export interface AdminTableItem {
  id: number;
  name: string;
  email?: string;
  price?: number;
  createdAt?: string;
  status: UserStatus | string;
  isFeaturedToday?: boolean;
  isFeaturedWeekly?: boolean;
  isAdminRecommended?: boolean;
  restaurantId?: number | null;
  restaurant?: { name: string; id?: number } | null;
  [key: string]: unknown;
}

interface AdminTableProps {
  activeTab: string;
  foodSubTab?: 'system' | 'merchant';
  loading: boolean;
  filteredData: AdminTableItem[];
  actions: {
    handleUpdateStatus: (id: number, status: string) => void;
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    handleDeleteUser: (id: number) => void;
    openEditModal: (food: AdminTableItem) => void;
    handleApproveFood?: (id: number, status: string) => void;
    handleToggleWeeklyFeatured?: (id: number, value: boolean) => void;
    handleBatchUpdate?: (updates: FoodBatchUpdateInput[]) => Promise<boolean>;
  };
}

export const AdminTable = ({
  activeTab,
  foodSubTab = 'merchant',
  loading,
  filteredData,
  actions,
}: AdminTableProps) => {
  if (loading) {
    const isMerchantMenu = activeTab === 'menu' && foodSubTab === 'merchant';
    const colSpan = isMerchantMenu ? 5 : 4;
    return (
      <div className="card-container overflow-hidden">
        <table className="w-full text-left">
          <tbody className="text-body">
            <tr>
              <td colSpan={colSpan} className="px-8 py-12 text-center text-gray-400">
                {LABELS.COMMON.LOADING}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'merchants') {
    return (
      <AdminMerchantApprovalTable
        filteredData={filteredData}
        actions={actions}
      />
    );
  }

  if (activeTab === 'users' || activeTab === 'customers') {
    return (
      <AdminUserTable
        filteredData={filteredData}
        actions={actions}
      />
    );
  }

  if (activeTab === 'menu') {
    if (foodSubTab === 'system') {
      return (
        <AdminSystemFoodTable
          filteredData={filteredData}
          actions={actions}
        />
      );
    } else {
      return (
        <AdminMerchantFoodTable
          filteredData={filteredData}
          actions={actions}
        />
      );
    }
  }

  return null;
};
