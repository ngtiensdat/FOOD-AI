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
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Search, FileUp } from 'lucide-react';

interface AdminTableProps {
  activeTab: 'merchants' | 'users' | 'menu' | 'customers' | 'moderation' | 'levels' | 'notifications';
  foodSubTab?: 'system' | 'merchant';
  setFoodSubTab?: (tab: 'system' | 'merchant') => void;
  loading: boolean;
  merchants: User[];
  users: User[];
  customers: User[];
  foods: AdminFoodItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onImportExcelClick?: () => void;
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
  setFoodSubTab,
  loading,
  merchants,
  users,
  customers,
  foods,
  searchQuery,
  setSearchQuery,
  onImportExcelClick,
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

  let content = null;

  if (activeTab === 'merchants') {
    content = (
      <AdminMerchantApprovalTable
        filteredData={merchants}
        actions={actions}
      />
    );
  } else if (activeTab === 'users') {
    content = (
      <AdminUserTable
        filteredData={users}
        actions={actions}
      />
    );
  } else if (activeTab === 'customers') {
    content = (
      <AdminUserTable
        filteredData={customers}
        actions={actions}
      />
    );
  } else if (activeTab === 'menu') {
    if (foodSubTab === 'system') {
      content = (
        <AdminSystemFoodTable
          filteredData={foods}
          actions={actions}
        />
      );
    } else {
      content = (
        <AdminMerchantFoodTable
          filteredData={foods}
          actions={actions}
        />
      );
    }
  }

  if (!content) return null;

  // Render header values
  let title = '';
  let description = '';

  switch (activeTab) {
    case 'merchants':
      title = LABELS.ADMIN.APPROVE_MERCHANTS;
      description = LABELS.ADMIN.TABLE.SHOWING_REQUESTS(merchants.length);
      break;
    case 'users':
      title = LABELS.ADMIN.MANAGE_MERCHANTS;
      description = LABELS.ADMIN.TABLE.SHOWING_RESTAURANTS(users.length);
      break;
    case 'customers':
      title = LABELS.ADMIN.MANAGE_CUSTOMERS;
      description = LABELS.ADMIN.TABLE.SHOWING_ACCOUNTS(customers.length);
      break;
    case 'menu':
      title = LABELS.ADMIN.MANAGE_MENU;
      description = LABELS.ADMIN.TABLE.SHOWING_FOODS(foods.length);
      break;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>

          {activeTab === 'menu' && (
            <div className="flex gap-6 mt-4 text-small font-bold">
              {[
                { id: 'merchant', label: LABELS.ADMIN.MERCHANT_FOOD },
                { id: 'system', label: LABELS.ADMIN.SYSTEM_FOOD }
              ].map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setFoodSubTab?.(tab.id as 'system' | 'merchant')}
                  className={`pb-2 border-b-2 transition-all ${foodSubTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  variant="none"
                  size="none"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {(activeTab === 'users' || activeTab === 'menu') && onImportExcelClick && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={onImportExcelClick}
            >
              <FileUp className="w-4 h-4" />
              {LABELS.ADMIN.IMPORT_EXCEL}
            </Button>
          )}
          <Input
            icon={Search}
            placeholder={LABELS.COMMON.SEARCH}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
        </div>
      </header>

      {loading && getCurrentDataLength() === 0 ? (
        <div className="card-container p-12 text-center text-gray-400 font-bold">
          {LABELS.COMMON.LOADING}
        </div>
      ) : (
        content
      )}
    </div>
  );
};
