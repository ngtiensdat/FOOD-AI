'use client';

// Mục đích file này để làm gì: Component base xử lý phân trang dưới dạng khung trượt (sliding window) với tối đa 5 trang.
// Các file khác hay file này có ý nghĩa như nào: Là Dumb Component dùng chung ở mọi nơi, được tái sử dụng trong các bảng quản trị.
// Các chức năng đặc biệt: Chứa công cụ nhảy nhanh đến trang bằng icon thăng (#) và ô nhập số trang linh hoạt.
// Các biến, hàm đặc biệt trong file: Pagination.

import React, { useState } from 'react';
import { Button } from './Button';
import { getPaginationRange } from '@/utils/helpers';
import { Hash } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  className = '',
}: PaginationProps) => {
  const [isJumping, setIsJumping] = useState(false);
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const pages = getPaginationRange(currentPage, totalPages, maxVisible);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setIsJumping(false);
      setJumpValue('');
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2.5 py-1.5 h-8 min-w-8"
        aria-label={LABELS.COMMON.PAGINATION?.PREVIOUS || "Trang trước"}
      >
        &lt;
      </Button>

      {pages.map((pNum) => (
        <Button
          key={pNum}
          variant={currentPage === pNum ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(pNum)}
          className="px-2.5 py-1.5 h-8 min-w-8"
        >
          {pNum}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2.5 py-1.5 h-8 min-w-8"
        aria-label={LABELS.COMMON.PAGINATION?.NEXT || "Trang sau"}
      >
        &gt;
      </Button>

      {totalPages > maxVisible && (
        <div className="flex items-center gap-1.5 ml-2 border-l pl-2 border-gray-200 dark:border-slate-800">
          {isJumping ? (
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 animate-fadeIn">
              <input
                type="number"
                min={1}
                max={totalPages}
                placeholder={`1-${totalPages}`}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                className="w-16 h-8 rounded-xl border border-gray-200 px-2 text-center text-xs font-bold focus:outline-none focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
                onBlur={() => setTimeout(() => setIsJumping(false), 200)}
              />
              <Button type="submit" variant="primary" size="sm" className="h-8 w-8 !p-0 rounded-xl">
                ✓
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsJumping(true)}
              className="px-2 py-1.5 h-8 min-w-8 text-gray-500 hover:text-primary"
              title={LABELS.COMMON.PAGINATION?.JUMP_TO_PAGE || "Nhảy nhanh đến trang"}
              aria-label={LABELS.COMMON.PAGINATION?.JUMP_TO_PAGE || "Nhảy nhanh đến trang"}
            >
              <Hash size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
