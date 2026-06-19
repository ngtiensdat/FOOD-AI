// Mục đích file này để làm gì: Component hiển thị trạng thái và biểu mẫu gửi yêu cầu xác minh email tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Tab con của SettingsSection, quản lý trạng thái xác thực email hiện tại và nút hành động gửi yêu cầu xác thực.
// Các chức năng đặc biệt: Hiển thị trạng thái Đã xác minh/Chưa xác minh trực quan, cho phép gửi link kích hoạt đến email đã nhập kèm modal xác nhận.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management, Confirmation Flow.
// Các biến, hàm đặc biệt trong file: VerificationSettingsTab component.
'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface VerificationSettingsTabProps {
  onVerifySubmit: (e: React.FormEvent) => Promise<void>;
  isEmailVerified: boolean | null;
  verifyEmail: string;
  setVerifyEmail: (val: string) => void;
  isLoading: boolean;
}

import { ConfirmModal } from '@/components/base/ConfirmModal';

export const VerificationSettingsTab = ({
  onVerifySubmit,
  isEmailVerified,
  verifyEmail,
  setVerifyEmail,
  isLoading,
}: VerificationSettingsTabProps) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-gray-50/35 p-6 rounded-card border border-gray-100/50 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <Mail className="text-primary" size={20} /> {LABELS.SETTINGS.VERIFICATION.TITLE}
        </h3>
        {isEmailVerified === true ? (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 mb-0 font-bold text-sm flex items-center gap-2">
            ✅ {LABELS.SETTINGS.VERIFICATION.VERIFIED}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-semibold ml-1">{LABELS.SETTINGS.VERIFICATION.LABEL}</label>
              <Input
                type="email"
                required
                placeholder={LABELS.FORM.PLACEHOLDERS.EMAIL}
                variant="none"
                className="form-input py-3 px-4 text-sm font-medium w-full"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail((e.target as HTMLInputElement).value)}
              />
            </div>
            <Button type="submit" loading={isLoading} fullWidth>
              {LABELS.SETTINGS.VERIFICATION.VERIFY_NOW}
            </Button>
          </form>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.SETTINGS.VERIFY_CONFIRM_TITLE}
        message={LABELS.SETTINGS.VERIFY_CONFIRM_DESC}
        confirmText={LABELS.SETTINGS.VERIFICATION.VERIFY_NOW}
        cancelText={LABELS.COMMON.CANCEL}
        variant="info"
        onConfirm={() => {
          setShowConfirm(false);
          onVerifySubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
        onCancel={() => {
          setShowConfirm(false);
        }}
      />
    </div>
  );
};
