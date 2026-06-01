'use client';

// Mục đích file này để làm gì: Hiển thị bảng danh sách tài khoản người dùng trong hệ thống.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable, phục vụ cả hai tab "Quản lý Thương gia" và "Quản lý Thực khách".
// Các chức năng đặc biệt: Phân trang danh sách tài khoản, chứa các nút xóa tài khoản nhanh.
// Các biến, hàm đặc biệt trong file: AdminUserTable.

import React, { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatDate } from '@/utils/formatters';
import { AdminTableItem } from './AdminTable';

interface AdminUserTableProps {
  filteredData: AdminTableItem[];
  actions: {
    handleDeleteUser: (_id: number) => void;
  };
}

const PAGE_SIZE = 5;

export const AdminUserTable = ({
  filteredData,
  actions,
}: AdminUserTableProps) => {
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
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.NAME}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.EMAIL}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.DATE}</th>
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
                <td className="px-8 py-6 text-gray-600 font-medium">{item.email}</td>
                <td className="px-8 py-6 text-gray-500">
                  {item.createdAt ? formatDate(item.createdAt) : LABELS.FORM.NOT_SET}
                </td>
                <td className="px-8 py-6 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.handleDeleteUser(item.id)}
                    className="text-red-600"
                    aria-label={LABELS.COMMON.DELETE}
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {totalPages > 1 && (
            <tr>
              <td colSpan={4} className="px-8 py-4 bg-gray-50/30 border-b border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-gray-400 font-bold">
                    {LABELS.ADMIN.TABLE.SHOWING_ACCOUNTS(filteredData.length)}
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
