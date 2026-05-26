'use client';

// Mục đích file này để làm gì: Hiển thị bảng danh sách món ăn của hệ thống.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable phục vụ tab "Hệ thống" trong Quản lý thực đơn.
// Các chức năng đặc biệt: Tích hợp phân trang, quản lý trạng thái món ăn hệ thống (Nổi bật ngày/tuần, Admin đề xuất).
// Các biến, hàm đặc biệt trong file: AdminSystemFoodTable.

import React, { useState, useMemo } from 'react';
import { Star, Sparkles, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { AdminTableItem } from './AdminTable';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';

interface AdminSystemFoodTableProps {
  filteredData: AdminTableItem[];
  actions: {
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    openEditModal: (food: AdminTableItem) => void;
    handleToggleWeeklyFeatured?: (id: number, value: boolean) => void;
  };
}

const PAGE_SIZE = 5;

export const AdminSystemFoodTable = ({
  filteredData,
  actions,
}: AdminSystemFoodTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, activePage]);

  return (
    <div className="card-container overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.FOOD_NAME}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.SOURCE}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.PRICE}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.ADMIN.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-body">
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-8 py-12 text-center text-gray-400">
                {LABELS.ADMIN.TABLE.EMPTY}
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                <td className="px-8 py-6 font-bold text-gray-800">{item.name}</td>
                <td className="px-8 py-6 text-gray-600 font-medium">{LABELS.FOOD.SYSTEM}</td>
                <td className="px-8 py-6 text-gray-500">{formatCurrency(item.price)}</td>
                <td className="px-8 py-6 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.handleUpdateFood(item.id, { isFeaturedToday: !item.isFeaturedToday })}
                      className={item.isFeaturedToday ? '!bg-orange-500 !text-white !border-none' : ''}
                      aria-label={LABELS.ADMIN.TABLE.FEATURE_TODAY}
                      title={LABELS.ADMIN.TABLE.FEATURE_TODAY}
                    >
                      <Star size={18} fill={item.isFeaturedToday ? 'white' : 'none'} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.handleToggleWeeklyFeatured?.(item.id, !item.isFeaturedWeekly)}
                      className={item.isFeaturedWeekly ? '!bg-purple-500 !text-white !border-none' : ''}
                      aria-label={LABELS.ADMIN.TABLE.FEATURE_WEEKLY}
                      title={LABELS.ADMIN.TABLE.FEATURE_WEEKLY}
                    >
                      <Sparkles size={18} fill={item.isFeaturedWeekly ? 'white' : 'none'} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.handleRecommendFood(item.id, !item.isAdminRecommended)}
                      className={item.isAdminRecommended ? '!bg-primary !text-white !border-none' : ''}
                      aria-label={LABELS.ADMIN.TABLE.ADMIN_RECOMMEND}
                      title={LABELS.ADMIN.TABLE.ADMIN_RECOMMEND}
                    >
                      <Sparkles size={18} fill={item.isAdminRecommended ? 'white' : 'none'} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.openEditModal(item)}
                      className="text-blue-600"
                      aria-label={LABELS.COMMON.EDIT}
                    >
                      <Settings size={18} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.handleDeleteFood(item.id)}
                      className="text-red-600"
                      aria-label={LABELS.COMMON.DELETE}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
          {totalPages > 1 && (
            <tr>
              <td colSpan={4} className="px-8 py-4 bg-gray-50/30 border-b border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-gray-400 font-bold">
                    {LABELS.ADMIN.TABLE.SHOWING_FOODS(filteredData.length)}
                  </span>
                  <Pagination
                    currentPage={activePage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
