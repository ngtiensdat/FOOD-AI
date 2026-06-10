'use client';

// Mục đích file: Hiển thị danh sách món ăn của hệ thống dưới dạng dòng trực quan.
// Ý nghĩa: Component con của AdminTable phục vụ tab "Hệ thống" trong Quản lý thực đơn.
// Các chức năng đặc biệt: Tích hợp phân trang, quản lý trạng thái món ăn hệ thống (Nổi bật ngày/tuần, Admin đề xuất) bằng MiniCardForAdmin.

import React, { useState, useMemo } from 'react';
import { Star, Sparkles, Settings, Trash2 } from 'lucide-react';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { AdminFoodItem } from '@/types/food';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';
import { MiniCardForAdmin } from './MiniCardForAdmin';

interface AdminSystemFoodTableProps {
  filteredData: AdminFoodItem[];
  actions: {
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    openEditModal: (food: AdminFoodItem) => void;
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
    <div className="space-y-6">
      {filteredData.length === 0 ? (
        <div className="card-container p-12 text-center text-gray-400">
          {LABELS.ADMIN.TABLE.EMPTY}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedData.map((item) => {
            const cardActions = [
              {
                label: LABELS.ADMIN.TABLE.FEATURE_TODAY,
                icon: <Star size={16} fill={item.isFeaturedToday ? 'white' : 'none'} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleUpdateFood(item.id, { isFeaturedToday: !item.isFeaturedToday });
                },
                active: item.isFeaturedToday,
                variant: 'primary' as const,
                title: LABELS.ADMIN.TABLE.FEATURE_TODAY
              },
              {
                label: LABELS.ADMIN.TABLE.FEATURE_WEEKLY,
                icon: <Sparkles size={16} fill={item.isFeaturedWeekly ? 'white' : 'none'} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleToggleWeeklyFeatured?.(item.id, !item.isFeaturedWeekly);
                },
                active: item.isFeaturedWeekly,
                variant: 'purple' as const,
                title: LABELS.ADMIN.TABLE.FEATURE_WEEKLY
              },
              {
                label: LABELS.ADMIN.TABLE.ADMIN_RECOMMEND,
                icon: <Sparkles size={16} fill={item.isAdminRecommended ? 'white' : 'none'} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleRecommendFood(item.id, !item.isAdminRecommended);
                },
                active: item.isAdminRecommended,
                variant: 'secondary' as const,
                title: LABELS.ADMIN.TABLE.ADMIN_RECOMMEND
              },
              {
                label: LABELS.COMMON.EDIT,
                icon: <Settings size={16} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.openEditModal(item);
                },
                variant: 'ghost' as const,
                title: LABELS.COMMON.EDIT
              },
              {
                label: LABELS.COMMON.DELETE,
                icon: <Trash2 size={16} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleDeleteFood(item.id);
                },
                variant: 'danger' as const,
                title: LABELS.COMMON.DELETE
              }
            ];

            return (
              <MiniCardForAdmin
                key={item.id}
                id={item.id}
                title={item.name}
                subtitle={item.description || LABELS.FOOD.NO_DESCRIPTION}
                image={item.image}
                meta={[
                  { label: LABELS.FOOD.SYSTEM, type: 'neutral' as const },
                  { label: formatCurrency(item.price), type: 'primary' as const }
                ]}
                actions={cardActions}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="card-container px-8 py-4 flex justify-between items-center">
          <span className="text-xs text-gray-400 font-bold">
            {LABELS.ADMIN.TABLE.SHOWING_FOODS(filteredData.length)}
          </span>
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
