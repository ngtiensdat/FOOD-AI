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

export interface ProfileIntroUserData {
  id?: number | string;
  email?: string;
  [key: string]: unknown;
}

export interface ProfileIntroData {
  createdAt?: Date | string;
  profile?: {
    workAt?: string;
    address?: string;
  };
  [key: string]: unknown;
}

interface ProfileIntroProps {
  profile: ProfileIntroData | null;
  user: ProfileIntroUserData | null;
  me: ProfileIntroUserData | null;
  onEdit: () => void;
}

export const ProfileIntro = ({ profile, user, me, onEdit }: ProfileIntroProps) => {
  return (
    <div className="card-container">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{LABELS.SETTINGS.PROFILE.INTRO.TITLE}</h2>
      <div className="space-y-4 text-small">
        {[
          { 
            icon: Briefcase, 
            text: LABELS.SETTINGS.PROFILE.INTRO.WORK(profile?.profile?.workAt || LABELS.SETTINGS.PROFILE.NOT_UPDATED) 
          },
          { 
            icon: MapPin, 
            text: LABELS.SETTINGS.PROFILE.INTRO.LIVES(profile?.profile?.address || LABELS.SETTINGS.PROFILE.NOT_UPDATED) 
          },
          { icon: Mail, text: user?.email },
          { 
            icon: Calendar, 
            text: LABELS.SETTINGS.PROFILE.INTRO.JOINED(new Date(profile?.createdAt || new Date()).getFullYear()) 
          },
        ].map((item, i) => (
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
