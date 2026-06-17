'use client';

// Mục đích file này để làm gì: Hiển thị danh sách tài khoản người dùng trong hệ thống dạng dòng trực quan.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable, phục vụ cả hai tab "Quản lý Thương gia" và "Quản lý Thực khách".
// Các chức năng đặc biệt: Phân trang danh sách tài khoản, chứa các nút xóa tài khoản nhanh.

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, User } from 'lucide-react';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatDate } from '@/utils/formatters';
import { User as UserType, UserRole } from '@/types/user';
import { MiniCardForAdmin } from './MiniCardForAdmin';
import { LIMITS } from '@/constants/limits.constant';

interface AdminUserTableProps {
  filteredData: UserType[];
  actions: {
    handleDeleteUser: (_id: number) => void;
  };
}



export const AdminUserTable = ({
  filteredData,
  actions,
}: AdminUserTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const totalPages = Math.ceil(filteredData.length / LIMITS.ADMIN_PAGE_SIZE);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * LIMITS.ADMIN_PAGE_SIZE;
    return filteredData.slice(start, start + LIMITS.ADMIN_PAGE_SIZE);
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
                label: LABELS.COMMON.DELETE,
                icon: <Trash2 size={16} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleDeleteUser(item.id);
                },
                variant: 'danger' as const,
                title: LABELS.COMMON.DELETE
              }
            ];

            const isMerchant = item.role === UserRole.RESTAURANT;

            return (
              <MiniCardForAdmin
                key={item.id}
                id={item.id}
                title={item.name}
                subtitle={item.email}
                image={item.avatar}
                fallbackIcon={<User size={36} />}
                onClick={() => router.push(`/profile?id=${item.id}`)}
                meta={[
                  { 
                    label: isMerchant ? LABELS.AUTH.RESTAURANT_ROLE : LABELS.AUTH.CUSTOMER, 
                    type: isMerchant ? 'secondary' as const : 'success' as const 
                  },
                  { 
                    label: item.createdAt ? LABELS.ADMIN.JOIN_DATE(formatDate(item.createdAt)) : LABELS.FORM.NOT_SET, 
                    type: 'neutral' as const 
                  }
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
            {LABELS.ADMIN.TABLE.SHOWING_ACCOUNTS(filteredData.length)}
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
