/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) để hiển thị Modal xác nhận hành động (Xóa, Cảnh báo, Thông báo).
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI thuần (Dumb Component), nhận trạng thái hiển thị (`isOpen`), nội dung (`title`, `message`) và các hàm callback (`onConfirm`, `onCancel`) từ component cha.
 * Các chức năng đặc biệt: Tích hợp sẵn `framer-motion` cho hiệu ứng chuyển động mượt mà. Hỗ trợ nhiều biến thể (danger, warning, info) tự động thay đổi icon và màu sắc tương ứng. Tái sử dụng `Button` component để đồng bộ giao diện.
 * Các biến, hàm đặc biệt trong file: `getIcon` và `getConfirmButtonVariant` xử lý logic hiển thị tuỳ theo biến thể `variant`.
 */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { LABELS } from '@/constants/labels';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = LABELS.COMMON.DELETE,
  cancelText = LABELS.COMMON.CANCEL,
  variant = 'danger'
}: ConfirmModalProps) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <Trash2 className="h-6 w-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
    }
  };

  const getConfirmButtonVariant = (): 'red' | 'primary' => {
    switch (variant) {
      case 'danger':
        return 'red';
      default:
        return 'primary';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-wrapper !z-[200]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="modal-overlay"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="modal-card max-w-md w-full !p-6 text-center relative z-10"
          >
            <div className="mb-4">
              {getIcon()}
            </div>
            
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              {title}
            </h3>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">
              {message}
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-5 py-2 rounded-lg border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={getConfirmButtonVariant()}
                onClick={onConfirm}
                className="px-5 py-2 rounded-lg transition"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
