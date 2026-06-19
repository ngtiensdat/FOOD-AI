// Mục đích file này để làm gì: Component hiển thị chi tiết thông tin cá nhân và preferences (Sở thích) của khách hàng.
// Các file khác hay file này có ý nghĩa như nào: Nằm trong trang Dashboard cá nhân của người dùng, giúp xem lại các thông tin đã lưu.
// Các chức năng đặc biệt: Hiển thị context AI dựa trên các preferences đã thiết lập để hệ thống AI hiểu rõ ngữ cảnh của user.
// Các biến, hàm đặc biệt trong file: profile (thông tin khách hàng), onUpdatePreferences (hàm gọi modal cập nhật sở thích).
'use client';

import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { resolvePrivacyValue } from '@/components/features/profile/ProfileSettingsTab';

interface UserProfileDetailProps {
  profile: { email?: string; profile?: { phone?: string; preferences?: Record<string, unknown> };[key: string]: unknown } | null;
  onUpdatePreferences: () => void;
}

export const UserProfileDetail = ({ profile, onUpdatePreferences }: UserProfileDetailProps) => {
  const showEmail = resolvePrivacyValue('showEmail', profile?.profile?.preferences, true);
  const showPhone = resolvePrivacyValue('showPhone', profile?.profile?.preferences, true);

  return (
    <section className="card-container p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-gray-800">{LABELS.CUSTOMER.INFO}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onUpdatePreferences}>
            <Sparkles size={16} className="mr-2" /> {LABELS.CUSTOMER.UPDATE_PREFERENCES}
          </Button>
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl" aria-label={LABELS.COMMON.OTHER}>
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-small">
        {showEmail && (
          <div>
            <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
              {LABELS.FORM.EMAIL}
            </label>
            <p className="font-bold text-gray-700">{profile?.email}</p>
          </div>
        )}
        {showPhone && (
          <div>
            <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
              {LABELS.FORM.PHONE}
            </label>
            <p className="font-bold text-gray-700">{profile?.profile?.phone || LABELS.FORM.NOT_SET}</p>
          </div>
        )}
        <div className="col-span-1 md:col-span-2">
          <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {LABELS.CUSTOMER.AI_CONTEXT}
          </label>
          <p className="font-bold text-gray-700 italic">
            {profile?.profile?.preferences
              ? Object.values(profile.profile.preferences).join(', ')
              : LABELS.FORM.NO_PREFERENCES}
          </p>
        </div>
      </div>
    </section>
  );
};
