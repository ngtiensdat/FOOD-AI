/**
 * Mục đích file này: Component hiển thị trạng thái và biểu mẫu gửi yêu cầu xác minh email tài khoản.
 * Ý nghĩa/Quan hệ: Tab con của SettingsSection, quản lý trạng thái xác thực email hiện tại và nút hành động gửi yêu cầu xác thực.
 * Các biến/Props đặc biệt: onVerifySubmit, isEmailVerified, verifyEmail, setVerifyEmail.
 */
'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface VerificationSettingsTabProps {
  onVerifySubmit: (e: React.FormEvent) => Promise<void>;
  isEmailVerified: boolean | null;
  verifyEmail: string;
  setVerifyEmail: (val: string) => void;
  isLoading: boolean;
}

export const VerificationSettingsTab = ({
  onVerifySubmit,
  isEmailVerified,
  verifyEmail,
  setVerifyEmail,
  isLoading,
}: VerificationSettingsTabProps) => {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-gray-55/35 p-6 rounded-card border border-gray-100/50 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <Mail className="text-primary" size={20} /> {LABELS.SETTINGS.VERIFICATION.TITLE}
        </h3>
        {isEmailVerified === true ? (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 mb-0 font-bold text-sm flex items-center gap-2">
            ✅ {LABELS.SETTINGS.VERIFICATION.VERIFIED}
          </div>
        ) : (
          <form onSubmit={onVerifySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-semibold ml-1">{LABELS.SETTINGS.VERIFICATION.LABEL}</label>
              <input
                type="email"
                required
                placeholder={LABELS.FORM.PLACEHOLDERS.EMAIL}
                className="w-full bg-white border border-gray-200 rounded-input py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm font-medium"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
              />
            </div>
            <Button type="submit" loading={isLoading} fullWidth>
              {LABELS.SETTINGS.VERIFICATION.VERIFY_NOW}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
