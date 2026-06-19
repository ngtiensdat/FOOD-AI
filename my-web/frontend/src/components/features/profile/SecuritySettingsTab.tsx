// Mục đích file này để làm gì: Component hiển thị giao diện thay đổi mật khẩu tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Tab con của SettingsSection, quản lý các trường nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới.
// Các chức năng đặc biệt: Cho phép toggle hiển thị mật khẩu bằng biểu tượng con mắt và thực hiện xác nhận thay đổi thông qua một modal trước khi lưu.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management, Confirmation Flow.
// Các biến, hàm đặc biệt trong file: SecuritySettingsTab component.
'use client';

import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface SecuritySettingsTabProps {
  onPasswordSubmit: (e: React.FormEvent) => Promise<void>;
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (val: string) => void;
  showOldPassword: boolean;
  setShowOldPassword: (val: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (val: boolean) => void;
  showConfirmNewPassword: boolean;
  setShowConfirmNewPassword: (val: boolean) => void;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
}

import { ConfirmModal } from '@/components/base/ConfirmModal';

export const SecuritySettingsTab = ({
  onPasswordSubmit,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword,
  isLoading,
  setActiveTab,
}: SecuritySettingsTabProps) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {[
          { 
            label: LABELS.SETTINGS.SECURITY.CURRENT_PASSWORD, 
            value: oldPassword, 
            setter: setOldPassword, 
            show: showOldPassword, 
            toggle: setShowOldPassword 
          },
          { 
            label: LABELS.SETTINGS.SECURITY.NEW_PASSWORD, 
            value: newPassword, 
            setter: setNewPassword, 
            show: showNewPassword, 
            toggle: setShowNewPassword 
          },
          { 
            label: LABELS.SETTINGS.SECURITY.CONFIRM_PASSWORD, 
            value: confirmNewPassword, 
            setter: setConfirmNewPassword, 
            show: showConfirmNewPassword, 
            toggle: setShowConfirmNewPassword 
          },
        ].map((field, idx) => (
          <div key={idx} className="space-y-2">
            <label className="text-small font-semibold text-gray-700 ml-1">{field.label}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input
                type={field.show ? 'text' : 'password'}
                required
                placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
                variant="none"
                className="form-input py-4 pl-12 pr-12 text-sm w-full"
                value={field.value}
                onChange={(e) => field.setter((e.target as HTMLInputElement).value)}
              />
              <Button
                type="button"
                onClick={() => field.toggle(!field.show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                variant="none"
                size="none"
              >
                {field.show ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button type="submit" loading={isLoading} fullWidth>
            {LABELS.SETTINGS.SECURITY.CHANGE_PASSWORD}
          </Button>
          <Button variant="outline" fullWidth onClick={() => setActiveTab('home')}>
            {LABELS.COMMON.CANCEL}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.SETTINGS.SECURITY_CONFIRM_TITLE}
        message={LABELS.SETTINGS.SECURITY_CONFIRM_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="warning"
        onConfirm={() => {
          setShowConfirm(false);
          onPasswordSubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
        onCancel={() => {
          setShowConfirm(false);
        }}
      />
    </>
  );
};
