/**
 * Mục đích file này: Component hiển thị khu vực nguy hiểm và modal xác nhận mật khẩu để xóa tài khoản vĩnh viễn.
 * Ý nghĩa/Quan hệ: Phần con tích hợp trong Profile tab của SettingsSection, bảo vệ an toàn cho thao tác phá hủy dữ liệu người dùng.
 * Các biến/Props đặc biệt: onDeleteSubmit, showDeleteModal, setShowDeleteModal, deletePassword, setDeletePassword.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface DangerZoneSectionProps {
  onDeleteSubmit: (e: React.FormEvent) => Promise<void>;
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  deletePassword: string;
  setDeletePassword: (val: string) => void;
  isDeleting: boolean;
}

export const DangerZoneSection = ({
  onDeleteSubmit,
  showDeleteModal,
  setShowDeleteModal,
  deletePassword,
  setDeletePassword,
  isDeleting,
}: DangerZoneSectionProps) => {
  return (
    <>
      <div className="bg-red-50/40 dark:bg-red-950/10 p-6 rounded-card border border-red-200/60 dark:border-red-900/30 space-y-4 max-w-2xl">
        <h3 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
          {LABELS.SETTINGS.DANGER_ZONE.TITLE}
        </h3>
        <p className="text-xs text-red-500 font-medium leading-relaxed">
          {LABELS.SETTINGS.DANGER_ZONE.WARNING}
        </p>
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="red"
          size="sm"
        >
          {LABELS.SETTINGS.DANGER_ZONE.BUTTON}
        </Button>
      </div>

      {/* Modal xác nhận xóa tài khoản */}
      {showDeleteModal && (
        <div className="modal-wrapper">
          <div
            className="modal-overlay"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeletePassword('');
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-card max-w-md relative z-10 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl rotate-3 shadow-inner">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{LABELS.SETTINGS.DANGER_ZONE.MODAL_TITLE}</h3>
              <p className="text-xs text-red-500 font-semibold leading-relaxed px-2">
                {LABELS.SETTINGS.DANGER_ZONE.MODAL_WARNING}
              </p>
            </div>

            <form onSubmit={onDeleteSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">
                  {LABELS.SETTINGS.DANGER_ZONE.PASSWORD_LABEL}
                </label>
                <Input
                  type="password"
                  required
                  placeholder={LABELS.SETTINGS.DANGER_ZONE.PASSWORD_PLACEHOLDER}
                  variant="none"
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-input py-3.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-950/20 dark:text-white transition-all text-sm font-medium"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                >
                  {LABELS.SETTINGS.DANGER_ZONE.CANCEL_BUTTON}
                </Button>
                <Button
                  type="submit"
                  loading={isDeleting}
                  variant="red"
                  className="flex-1"
                >
                  {LABELS.SETTINGS.DANGER_ZONE.CONFIRM_BUTTON}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};
