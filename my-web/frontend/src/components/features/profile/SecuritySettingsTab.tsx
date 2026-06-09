/**
 * Mục đích file này: Component hiển thị giao diện thay đổi mật khẩu tài khoản.
 * Ý nghĩa/Quan hệ: Tab con của SettingsSection, quản lý các trường nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới.
 * Các biến/Props đặc biệt: onPasswordSubmit, oldPassword, newPassword, confirmNewPassword.
 */
'use client';

import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/base/Button';
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
  return (
    <form onSubmit={onPasswordSubmit} className="space-y-6 max-w-2xl">
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
            <input
              type={field.show ? 'text' : 'password'}
              required
              placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
              className="form-input py-4 pl-12 pr-12 text-sm"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
            />
            <button
              type="button"
              onClick={() => field.toggle(!field.show)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {field.show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
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
  );
};
