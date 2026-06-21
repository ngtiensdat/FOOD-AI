/**
 * @fileoverview frontend/src/components/features/profile/ProfileIntro.tsx
 * @description Component card "Giới thiệu" bên sidebar trang cá nhân.
 * Hiển thị thông tin nơi làm việc, địa chỉ, email và ngày tham gia theo phong cách premium.
 */
'use client';

import React from 'react';
import { Briefcase, MapPin, Mail, Calendar, Edit3 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';
import { resolvePrivacyValue } from '@/components/features/profile/ProfileSettingsTab';

export type ProfileIntroData = User & { createdAt?: Date | string };

interface ProfileIntroProps {
  profile: ProfileIntroData | null;
  user: User | null;
  me: User | null;
  onEdit: () => void;
}

interface IntroItem {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  highlight?: boolean;
}

export const ProfileIntro = ({ profile, user, me, onEdit }: ProfileIntroProps) => {
  const isOwner = me?.id === user?.id;
  const showAddress = resolvePrivacyValue('showAddress', profile?.profile?.preferences, isOwner);
  const showEmail = resolvePrivacyValue('showEmail', profile?.profile?.preferences, isOwner);

  const joinYear = new Date(profile?.createdAt || new Date()).getFullYear();

  const items: IntroItem[] = [
    {
      icon: Briefcase,
      label: LABELS.SETTINGS.PROFILE.INTRO.WORK_AT,
      value: profile?.profile?.workAt || undefined,
    },
    showAddress ? {
      icon: MapPin,
      label: LABELS.SETTINGS.PROFILE.INTRO.LIVE_IN,
      value: profile?.profile?.address?.replace(/^[\s,]+|[\s,]+$/g, '').replace(/,(\s*,)+/g, ',') || undefined,
    } : null,
    showEmail ? {
      icon: Mail,
      label: LABELS.SETTINGS.PROFILE.INTRO.EMAIL,
      value: user?.email || undefined,
    } : null,
    {
      icon: Calendar,
      label: LABELS.SETTINGS.PROFILE.INTRO.JOINED_YEAR,
      value: String(joinYear),
      highlight: true,
    },
  ].filter(Boolean) as IntroItem[];

  return (
    <div className="card-container p-5 overflow-hidden">
      {/* Header gradient */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
          {LABELS.SETTINGS.PROFILE.INTRO.TITLE}
        </h2>
        {isOwner && (
          <Button
            variant="none"
            size="none"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <Edit3 size={12} />
            {LABELS.SETTINGS.PROFILE.INTRO.EDIT_BTN}
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 group"
          >
            {/* Icon container */}
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${item.highlight
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
              }`}>
              <item.icon size={15} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                {item.label}
              </p>
              <p className={`text-sm font-semibold leading-snug truncate
                ${item.value
                  ? 'text-gray-800 dark:text-slate-200'
                  : 'text-gray-300 dark:text-slate-600 italic text-xs'
                }`}>
                {item.value || 'Chưa cập nhật'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bio section nếu có */}
      {profile?.profile?.bio && (
        <div className="mt-5 pt-4 border-t border-gray-50 dark:border-slate-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Giới thiệu</p>
          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
            {profile.profile.bio}
          </p>
        </div>
      )}

      {/* Edit button — chỉ cho owner, ở cuối */}
      {isOwner && (
        <Button
          variant="secondary"
          fullWidth
          className="mt-5"
          onClick={onEdit}
        >
          <Edit3 size={14} className="mr-1.5" />
          {LABELS.SETTINGS.PROFILE.INTRO.EDIT_DETAILS}
        </Button>
      )}
    </div>
  );
};
