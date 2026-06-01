'use client';

// Mục đích file này để làm gì: Hiển thị bảng danh sách đối tác (Merchant) đang chờ duyệt hoặc đã duyệt dạng dòng trực quan.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable, phục vụ tab "Duyệt đối tác".
// Các chức năng đặc biệt: Render danh sách thẻ đối tác trực quan với các nút phê duyệt/từ chối.

import React, { useState, useMemo } from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatDate } from '@/utils/formatters';
import { User, UserStatus } from '@/types/user';
import { MiniCardForAdmin } from './MiniCardForAdmin';

interface AdminMerchantApprovalTableProps {
  filteredData: User[];
  actions: {
    handleUpdateStatus: (id: number, status: string) => void;
  };
}

const PAGE_SIZE = 5;

export const AdminMerchantApprovalTable = ({
  filteredData,
  actions,
}: AdminMerchantApprovalTableProps) => {
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
        <div className="card-container p-12 text-center text-gray-400 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          {LABELS.ADMIN.TABLE.EMPTY}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedData.map((item) => {
            const cardActions = [
              {
                label: LABELS.COMMON.APPROVE,
                icon: <Check size={18} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleUpdateStatus(item.id, UserStatus.APPROVED);
                },
                variant: 'success' as const,
                title: LABELS.COMMON.APPROVE
              },
              {
                label: LABELS.COMMON.REJECT,
                icon: <X size={18} />,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.handleUpdateStatus(item.id, UserStatus.REJECTED);
                },
                variant: 'danger' as const,
                title: LABELS.COMMON.REJECT
              }
            ];

            const subtitleNode = (
              <div className="space-y-1 text-left">
                <p className="font-semibold text-gray-600 dark:text-slate-400 truncate">{item.email}</p>
                {!!item.legalDocs && (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate" title={item.legalDocs}>
                    {LABELS.ADMIN.LEGAL_DOCS(item.legalDocs)}
                  </p>
                )}
              </div>
            );

            return (
              <MiniCardForAdmin
                key={item.id}
                id={item.id}
                title={item.name}
                subtitle={subtitleNode}
                image={item.avatar}
                fallbackIcon={<UserCheck size={36} />}
                meta={[
                  { label: LABELS.AUTH.RESTAURANT, type: 'secondary' as const },
                  { 
                    label: item.createdAt ? LABELS.ADMIN.REGISTER_DATE(formatDate(item.createdAt)) : LABELS.FORM.NOT_SET, 
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
        <div className="card-container px-8 py-4 flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          <span className="text-xs text-gray-400 font-bold">
            {LABELS.ADMIN.TABLE.SHOWING_REQUESTS(filteredData.length)}
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
