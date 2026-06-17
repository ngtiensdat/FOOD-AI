/**
 * Mục đích file này để làm gì: Component hiển thị phần Giới thiệu (Intro) ngắn gọn trên trang cá nhân.
 * Các file khác hay file này có ý nghĩa như nào: Nằm bên cột trái (hoặc phía trên) của giao diện trang cá nhân, tóm tắt thông tin như nơi làm việc, nơi sống, email và ngày tham gia.
 * Các chức năng đặc biệt: Tự động hiển thị nút "Chỉnh sửa chi tiết" nếu người dùng đang xem trang của chính mình.
 */
'use client';

import React from 'react';
import { Briefcase, MapPin, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';

import { getPrivacyValue } from '@/components/features/profile/ProfileSettingsTab';

export type ProfileIntroData = User & { createdAt?: Date | string };

interface ProfileIntroProps {
  profile: ProfileIntroData | null;
  user: User | null;
  me: User | null;
  onEdit: () => void;
}

export const ProfileIntro = ({ profile, user, me, onEdit }: ProfileIntroProps) => {
  const isOwner = me?.id === user?.id;
  const showAddress = isOwner ? getPrivacyValue('showAddress') : true;
  const showEmail = isOwner ? getPrivacyValue('showEmail') : true;

  const items = [
    { 
      icon: Briefcase, 
      text: LABELS.SETTINGS.PROFILE.INTRO.WORK(profile?.profile?.workAt || LABELS.SETTINGS.PROFILE.NOT_UPDATED),
      visible: true,
    },
    { 
      icon: MapPin, 
      text: LABELS.SETTINGS.PROFILE.INTRO.LIVES(profile?.profile?.address || LABELS.SETTINGS.PROFILE.NOT_UPDATED),
      visible: showAddress,
    },
    { 
      icon: Mail, 
      text: user?.email,
      visible: showEmail,
    },
    { 
      icon: Calendar, 
      text: LABELS.SETTINGS.PROFILE.INTRO.JOINED(new Date(profile?.createdAt || new Date()).getFullYear()),
      visible: true,
    },
  ].filter(item => item.visible);

  return (
    <div className="card-container">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{LABELS.SETTINGS.PROFILE.INTRO.TITLE}</h2>
      <div className="space-y-4 text-small">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-gray-700">
            <item.icon size={20} className="text-gray-400" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      {me?.id === user?.id && (
        <Button variant="secondary" fullWidth className="mt-6" onClick={onEdit}>
          {LABELS.SETTINGS.PROFILE.INTRO.EDIT_DETAILS}
        </Button>
      )}
    </div>
  );
};
