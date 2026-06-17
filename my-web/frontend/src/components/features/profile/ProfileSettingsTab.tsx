// Mục đích file này để làm gì: Component hiển thị giao diện cấu hình thông tin cá nhân và cài đặt riêng tư của tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Tab con của SettingsSection, quản lý thông tin tên hiển thị, email và trạng thái hiển thị danh sách theo dõi.
// Các chức năng đặc biệt: Cho phép toggle ẩn/hiện từng mục thông tin cá nhân (level, badge, điểm, XP, email, SĐT, địa chỉ, danh sách theo dõi).
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management, Atomic Privacy Controls.
// Các biến, hàm đặc biệt trong file: ProfileSettingsTab, PRIVACY_KEYS, PRIVACY_FIELDS, getPrivacyValue.
'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

interface ProfileSettingsTabProps {
  user: { id?: string | number; name?: string; email?: string; role?: string; [key: string]: unknown } | null;
  profileData: { profile?: { preferences?: { showFollowList?: boolean; showPersonalInfo?: boolean } }; [key: string]: unknown } | null;
  setProfileData: React.Dispatch<React.SetStateAction<{ profile?: { preferences?: { showFollowList?: boolean } }; [key: string]: unknown } | null>>;
}

/** Key localStorage cho từng trường thông tin cá nhân */
export const PRIVACY_KEYS = {
  showLevel: 'privacy_showLevel',
  showBadge: 'privacy_showBadge',
  showPoints: 'privacy_showPoints',
  showXpBar: 'privacy_showXpBar',
  showFollowList: 'privacy_showFollowList',
  showEmail: 'privacy_showEmail',
  showPhone: 'privacy_showPhone',
  showAddress: 'privacy_showAddress',
} as const;

/** Đọc giá trị từ localStorage, mặc định true (hiển thị) */
export function getPrivacyValue(key: keyof typeof PRIVACY_KEYS): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(PRIVACY_KEYS[key]);
  return stored !== null ? JSON.parse(stored) : true;
}

export const ProfileSettingsTab = ({
  user,
  profileData,
  setProfileData,
}: ProfileSettingsTabProps) => {
  // Fields mapped to dynamic LABELS
  const fields = [
    { key: 'showLevel' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showLevel },
    { key: 'showBadge' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showBadge },
    { key: 'showPoints' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showPoints },
    { key: 'showXpBar' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showXpBar },
    { key: 'showFollowList' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showFollowList },
    { key: 'showEmail' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showEmail },
    { key: 'showPhone' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showPhone },
    { key: 'showAddress' as const, ...LABELS.SETTINGS.PROFILE.PRIVACY_FIELDS.showAddress },
  ];

  // State cho từng toggle nguyên tử
  const [privacyState, setPrivacyState] = React.useState(() => ({
    showLevel: getPrivacyValue('showLevel'),
    showBadge: getPrivacyValue('showBadge'),
    showPoints: getPrivacyValue('showPoints'),
    showXpBar: getPrivacyValue('showXpBar'),
    showFollowList: getPrivacyValue('showFollowList'),
    showEmail: getPrivacyValue('showEmail'),
    showPhone: getPrivacyValue('showPhone'),
    showAddress: getPrivacyValue('showAddress'),
  }));

  /** Toggle một trường cụ thể */
  const handleToggleField = (key: keyof typeof PRIVACY_KEYS) => {
    const newValue = !privacyState[key];
    localStorage.setItem(PRIVACY_KEYS[key], JSON.stringify(newValue));
    setPrivacyState(prev => ({ ...prev, [key]: newValue }));
    const field = fields.find(f => f.key === key);
    toast.success(LABELS.SETTINGS.PROFILE.PRIVACY_TOAST_SUCCESS(field?.label || '', newValue));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Thông tin tài khoản */}
      <div className="card-container p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <UserIcon className="text-primary" size={20} /> {LABELS.SETTINGS.PROFILE.TITLE}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400 block font-semibold mb-1">{LABELS.SETTINGS.PROFILE.FULL_NAME}</span>
            <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
              {user?.name || LABELS.SETTINGS.PROFILE.NOT_UPDATED}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold mb-1">{LABELS.FORM.EMAIL}</span>
            <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
              {user?.email || LABELS.SETTINGS.PROFILE.NOT_UPDATED}
            </p>
          </div>
        </div>
      </div>

      {/* Ẩn/hiện thông tin cá nhân - toggle NGUYÊN TỬ cho từng trường */}
      <div className="card-container p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          {LABELS.SETTINGS.PROFILE.PRIVACY_TITLE}
        </h3>
        <p className="text-xs text-gray-400 font-medium">
          {LABELS.SETTINGS.PROFILE.PRIVACY_DESC}
        </p>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
              <div className="pr-4">
                <span className="font-bold text-gray-700 block mb-0.5">{field.label}</span>
                <span className="text-xs text-gray-400 font-medium">{field.desc}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={privacyState[field.key]}
                  onChange={() => handleToggleField(field.key)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


