/**
 * Mục đích file này: Component hiển thị giao diện cấu hình thông tin cá nhân và cài đặt riêng tư của tài khoản.
 * Ý nghĩa/Quan hệ: Tab con của SettingsSection, quản lý thông tin tên hiển thị, email và trạng thái hiển thị danh sách theo dõi của RESTAURANT.
 * Các biến/Props đặc biệt: user, profileData, setProfileData.
 */
'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { authService } from '@/services/auth.service';

interface ProfileSettingsTabProps {
  user: { id?: string | number; name?: string; email?: string; role?: string; [key: string]: unknown } | null;
  profileData: { profile?: { preferences?: { showFollowList?: boolean } }; [key: string]: unknown } | null;
  setProfileData: React.Dispatch<React.SetStateAction<{ profile?: { preferences?: { showFollowList?: boolean } }; [key: string]: unknown } | null>>;
}

export const ProfileSettingsTab = ({
  user,
  profileData,
  setProfileData,
}: ProfileSettingsTabProps) => {
  return (
    <div className="space-y-6 max-w-2xl">
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

      {user?.role === 'RESTAURANT' && (
        <div className="card-container p-6 space-y-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            {LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_TITLE}
          </h3>
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
            <div className="pr-4">
              <span className="font-bold text-gray-700 block mb-0.5">{LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_LABEL}</span>
              <span className="text-xs text-gray-400 font-medium">{LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_DESC}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profileData?.profile?.preferences?.showFollowList !== false}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  try {
                    await authService.updateProfile({
                      preferences: { showFollowList: checked }
                    });
                    toast.success(LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_SUCCESS);
                    setProfileData((prev) => ({
                      ...prev,
                      profile: {
                        ...prev?.profile,
                        preferences: {
                          ...prev?.profile?.preferences,
                          showFollowList: checked
                        }
                      }
                    }));
                  } catch {
                    toast.error(LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_ERROR);
                  }
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
