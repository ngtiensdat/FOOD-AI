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
import { Input } from '@/components/base/Input';

import { userService } from '@/services/user.service';

interface ProfileSettingsTabProps {
  user: { id?: string | number; name?: string; email?: string; role?: string; [key: string]: unknown } | null;
  profileData: { profile?: { preferences?: Record<string, unknown> }; [key: string]: unknown } | null;
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
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

/**
 * Giải quyết giá trị ẩn/hiện thông tin cá nhân dựa trên preferences từ Database,
 * và fallback về localStorage nếu là chủ sở hữu (owner).
 */
export function resolvePrivacyValue(
  key: keyof typeof PRIVACY_KEYS,
  profilePreferences: Record<string, unknown> | null | undefined,
  isOwner: boolean
): boolean {
  // 1. Kiểm tra trong preferences từ DB (do server trả về)
  if (profilePreferences && profilePreferences[key] !== undefined) {
    return profilePreferences[key] === true;
  }
  
  // 2. Nếu là chủ sở hữu và chưa có trên DB, đọc từ localStorage làm fallback
  if (isOwner) {
    return getPrivacyValue(key);
  }
  
  // 3. Mặc định là hiển thị nếu không có cấu hình và là khách xem
  return true;
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
  const [privacyState, setPrivacyState] = React.useState(() => {
    const dbPrefs = profileData?.profile?.preferences;
    return {
      showLevel: dbPrefs?.showLevel !== undefined ? dbPrefs.showLevel === true : getPrivacyValue('showLevel'),
      showBadge: dbPrefs?.showBadge !== undefined ? dbPrefs.showBadge === true : getPrivacyValue('showBadge'),
      showPoints: dbPrefs?.showPoints !== undefined ? dbPrefs.showPoints === true : getPrivacyValue('showPoints'),
      showXpBar: dbPrefs?.showXpBar !== undefined ? dbPrefs.showXpBar === true : getPrivacyValue('showXpBar'),
      showFollowList: dbPrefs?.showFollowList !== undefined ? dbPrefs.showFollowList === true : getPrivacyValue('showFollowList'),
      showEmail: dbPrefs?.showEmail !== undefined ? dbPrefs.showEmail === true : getPrivacyValue('showEmail'),
      showPhone: dbPrefs?.showPhone !== undefined ? dbPrefs.showPhone === true : getPrivacyValue('showPhone'),
      showAddress: dbPrefs?.showAddress !== undefined ? dbPrefs.showAddress === true : getPrivacyValue('showAddress'),
    };
  });

  React.useEffect(() => {
    if (profileData?.profile) {
      const dbPrefs = profileData.profile.preferences;
      setPrivacyState({
        showLevel: dbPrefs?.showLevel !== undefined ? dbPrefs.showLevel === true : getPrivacyValue('showLevel'),
        showBadge: dbPrefs?.showBadge !== undefined ? dbPrefs.showBadge === true : getPrivacyValue('showBadge'),
        showPoints: dbPrefs?.showPoints !== undefined ? dbPrefs.showPoints === true : getPrivacyValue('showPoints'),
        showXpBar: dbPrefs?.showXpBar !== undefined ? dbPrefs.showXpBar === true : getPrivacyValue('showXpBar'),
        showFollowList: dbPrefs?.showFollowList !== undefined ? dbPrefs.showFollowList === true : getPrivacyValue('showFollowList'),
        showEmail: dbPrefs?.showEmail !== undefined ? dbPrefs.showEmail === true : getPrivacyValue('showEmail'),
        showPhone: dbPrefs?.showPhone !== undefined ? dbPrefs.showPhone === true : getPrivacyValue('showPhone'),
        showAddress: dbPrefs?.showAddress !== undefined ? dbPrefs.showAddress === true : getPrivacyValue('showAddress'),
      });
    }
  }, [profileData]);

  /** Toggle một trường cụ thể */
  const handleToggleField = async (key: keyof typeof PRIVACY_KEYS) => {
    const newValue = !privacyState[key];
    localStorage.setItem(PRIVACY_KEYS[key], JSON.stringify(newValue));
    setPrivacyState(prev => ({ ...prev, [key]: newValue }));

    try {
      const dbPrefs = profileData?.profile?.preferences || {};
      const updatedPrefs = {
        ...dbPrefs,
        [key]: newValue,
      };

      await userService.updateProfile({
        preferences: updatedPrefs,
      });

      setProfileData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            preferences: updatedPrefs,
          },
        };
      });

      const field = fields.find(f => f.key === key);
      toast.success(LABELS.SETTINGS.PROFILE.PRIVACY_TOAST_SUCCESS(field?.label || '', newValue));
    } catch (err) {
      console.error('Lỗi khi lưu thiết lập riêng tư:', err);
      toast.error('Không thể lưu thiết lập riêng tư lên server.');
      setPrivacyState(prev => ({ ...prev, [key]: !newValue }));
      localStorage.setItem(PRIVACY_KEYS[key], JSON.stringify(!newValue));
    }
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
                <Input
                  type="checkbox"
                  className="sr-only peer"
                  checked={privacyState[field.key]}
                  onChange={() => handleToggleField(field.key)}
                  variant="none"
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


