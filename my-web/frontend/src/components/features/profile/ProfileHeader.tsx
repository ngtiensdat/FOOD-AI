/**
 * Mục đích file này để làm gì: Component Header của trang cá nhân (Profile).
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị thông tin tổng quan của người dùng hoặc nhà hàng, bao gồm ảnh bìa, avatar, thông tin trạng thái hoạt động và các nút tương tác (Follow, Edit, Dashboard).
 * Các chức năng đặc biệt: Tự động tính toán trạng thái "Đang mở cửa / Đóng cửa" dựa trên giờ hoạt động (openingHours) và trạng thái hiển thị (isActive).
 */
'use client';

import React, { useMemo } from 'react';
import SafeImage from '@/components/base/SafeImage';
import { Camera, Shield, Store, Grid, Edit3, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Avatar } from '@/components/base/Avatar';
import { LABELS } from '@/constants/labels';
import { useRouter } from 'next/navigation';
import { getValidImageUrl, isRestaurantCurrentlyOpen } from '@/utils/helpers';
import { User, UserRole } from '@/types/user';
import { resolvePrivacyValue } from '@/components/features/profile/ProfileSettingsTab';
import { GAMIFICATION_CONSTANTS } from '@/constants/gamification.constant';

export type ProfileData = User & {
  _count?: {
    followers?: number;
    userFollowers?: number;
    userFollowing?: number;
    follows?: number;
    posts?: number;
  };
  restaurants?: Array<{
    isActive?: boolean;
    profile?: {
      openingHours?: string;
    };
    _count?: {
      followers?: number;
    };
  }>;
};

interface ProfileHeaderProps {
  user: User | null;
  profile: ProfileData;
  me: Partial<User> | null;
  isFollowLoading: boolean;
  onEdit: () => void;
  onFollow: () => void;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}


export const ProfileHeader = ({
  user,
  profile,
  me,
  isFollowLoading,
  onEdit,
  onFollow,
  onShowFollowers,
  onShowFollowing
}: ProfileHeaderProps) => {
  const router = useRouter();
  const restaurant = profile?.restaurants?.[0];
  const isOwner = me?.id === user?.id;
  const showLevel = resolvePrivacyValue('showLevel', profile?.profile?.preferences, isOwner);
  const showBadgeTitle = resolvePrivacyValue('showBadge', profile?.profile?.preferences, isOwner);
  const showPoints = resolvePrivacyValue('showPoints', profile?.profile?.preferences, isOwner);
  const showXpBar = resolvePrivacyValue('showXpBar', profile?.profile?.preferences, isOwner);
  const showFollowList = resolvePrivacyValue('showFollowList', profile?.profile?.preferences, isOwner);
  const isOpen = restaurant
    ? isRestaurantCurrentlyOpen(restaurant.profile?.openingHours, restaurant.isActive)
    : true;

  const xpPercentage = useMemo(() => {
    const currentXp = profile?.xp || 0;
    const pointsPerLevel = GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL;
    const progress = (currentXp % pointsPerLevel) / pointsPerLevel;
    return Math.max(GAMIFICATION_CONSTANTS.MIN_XP_PERCENT, progress * GAMIFICATION_CONSTANTS.PERCENT_FACTOR);
  }, [profile?.xp]);

  return (
    <div className="card-container !p-0 overflow-hidden">
      {/* Cover Photo */}
      <div className="h-64 md:h-96 relative group cursor-pointer overflow-hidden">
        {profile?.profile?.coverImage ? (
          <SafeImage
            src={getValidImageUrl(profile.profile.coverImage)}
            alt={LABELS.SETTINGS.PROFILE.EDIT_MODAL.COVER}
            fill
            sizes="(max-width: 768px) 100vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-bg" />
        )}
        {me?.id === user?.id && (
          <Button
            variant="outline"
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm z-10"
            onClick={onEdit}
          >
            <Camera size={18} className="mr-2" /> {LABELS.SETTINGS.PROFILE.EDIT_COVER}
          </Button>
        )}
      </div>

      <div className="px-6 md:px-12 pb-10 pt-8">
        {/* Warning Banner if closed */}
        {user?.role === UserRole.RESTAURANT && restaurant && !isOpen && (
          <div className="alert-box-rose mb-8">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{LABELS.RESTAURANT.CLOSED_WARNING_TITLE}</p>
              <p className="text-xs opacity-90 leading-relaxed mt-0.5">
                {restaurant.isActive === false
                  ? LABELS.RESTAURANT.CLOSED_BY_MERCHANT
                  : LABELS.RESTAURANT.CLOSED_OUTSIDE_HOURS(restaurant.profile?.openingHours || LABELS.RESTAURANT.NOT_SET)}
              </p>
            </div>
          </div>
        )}

        <div className="relative flex flex-col md:flex-row items-center gap-8 mb-10">
          {/* Avatar Section */}
          <div className="relative group -mt-24 md:-mt-32">
            <div className="relative overflow-hidden w-40 h-40 md:w-48 md:h-48 rounded-full border-[6px] border-white shadow-2xl bg-white transition-transform hover:scale-[1.02]">
              <Avatar
                src={profile?.profile?.avatar}
                name={user?.name}
                size={192}
                className="w-full h-full"
                fallbackClassName="text-5xl"
              />
            </div>
            {me?.id === user?.id && (
              <Button
                onClick={onEdit}
                className="absolute bottom-2 right-2 p-2 bg-gray-100 rounded-full border-2 border-white hover:bg-gray-200 transition-all z-10"
                aria-label={LABELS.COMMON.EDIT}
                variant="none"
                size="none"
              >
                <Camera size={20} />
              </Button>
            )}
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            {/* Name row — clamp dài, size nhỏ hơn cho RESTAURANT */}
            <h1 className={`font-black text-gray-900 mb-2 flex flex-wrap justify-center md:justify-start items-center gap-2 leading-tight
              ${user?.role === UserRole.RESTAURANT
                ? 'text-xl md:text-2xl'
                : 'text-3xl md:text-4xl'
              }`}>
              <span className={user?.role === UserRole.RESTAURANT ? 'line-clamp-2 md:line-clamp-none' : ''}>
                {user?.name}
              </span>
              {showLevel && (user?.role === UserRole.CUSTOMER || user?.role === UserRole.RESTAURANT) && (
                <Button
                  onClick={() => router.push('/badges')}
                  className="text-xs font-extrabold px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full shadow-md hover:from-amber-600 hover:to-orange-700 transition-all cursor-pointer shrink-0 self-start mt-1"
                  variant="none"
                  size="none"
                >
                  Lv. {profile?.level || 1}
                </Button>
              )}
            </h1>
            {showBadgeTitle && profile?.badgeTitle && (
              <div className="flex justify-center md:justify-start mt-1 mb-2">
                <Button
                  onClick={() => router.push('/badges')}
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md shadow-sm hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
                  variant="none"
                  size="none"
                >
                  <SafeImage src="/images/badges/badge_star.png" alt="Star" width={14} height={14} className="object-contain shrink-0" />
                  <span>{profile.badgeTitle}</span>
                </Button>
              </div>
            )}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-small font-bold text-gray-500 mb-4">
              {user?.role === UserRole.ADMIN ? (
                <span className="flex items-center gap-1.5"><Shield size={18} className="text-primary" /> {LABELS.AUTH.ADMIN}</span>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  {user?.role === UserRole.RESTAURANT && (
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="flex items-center gap-1.5"><Store size={18} className="text-primary" /> {LABELS.AUTH.RESTAURANT_ROLE}</span>
                      <span className="text-gray-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                        <Clock size={14} />
                        {LABELS.RESTAURANT.OPERATING_HOURS_LABEL}: {restaurant?.profile?.openingHours || LABELS.RESTAURANT.NOT_SET}
                      </span>
                      <span className="text-gray-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isOpen ? LABELS.RESTAURANT.STATUS_OPEN : LABELS.RESTAURANT.STATUS_CLOSED}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {(user?.role === UserRole.CUSTOMER || user?.role === UserRole.RESTAURANT) && (
                      <>
                        <span className="text-gray-500">
                          {LABELS.SETTINGS.PROFILE.POSTS_COUNT(profile?._count?.posts || 0)}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    {showFollowList ? (
                      <>
                        <Button
                          onClick={onShowFollowers}
                          className="hover:text-primary transition-colors cursor-pointer"
                          variant="none"
                          size="none"
                        >
                          {(profile?.restaurants?.[0]?._count?.followers || 0) + (profile?._count?.userFollowers || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWERS}
                        </Button>
                        <span>•</span>
                        <Button
                          onClick={onShowFollowing}
                          className="hover:text-primary transition-colors cursor-pointer"
                          variant="none"
                          size="none"
                        >
                          {(profile?._count?.userFollowing || 0) + (profile?._count?.follows || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWING}
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{LABELS.SETTINGS.PROFILE.FOLLOW_LIST_PRIVATE}</span>
                    )}
                    {showPoints && (user?.role === UserRole.CUSTOMER || user?.role === UserRole.RESTAURANT) && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-extrabold border border-amber-200 dark:border-amber-900/50">
                          <span>⭐</span>
                          <span>{profile?.points?.toLocaleString() || 0} {LABELS.LOYALTY.POINTS}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {showXpBar && (user?.role === UserRole.CUSTOMER || user?.role === UserRole.RESTAURANT) && (
                    <div className="mt-1 max-w-xs">
                      <div className="flex justify-between text-mini text-gray-500 mb-1 font-bold">
                        <span>{LABELS.LOYALTY.XP_PROGRESS}</span>
                        <span>{(profile?.xp || 0) % GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL} / {GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL} XP</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-gray-200 dark:border-slate-700">
                        <div 
                          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                          style={{ width: `${xpPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-body text-gray-600 max-w-lg">
              {profile?.profile?.bio || LABELS.SETTINGS.PROFILE.BIO_EMPTY}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {me?.id !== user?.id && user?.role !== UserRole.ADMIN && me?.role !== UserRole.ADMIN ? (
              <Button
                variant={user?.isFollowing ? 'secondary' : 'primary'}
                onClick={onFollow}
                loading={isFollowLoading}
                className="px-8"
              >
                {user?.isFollowing ? LABELS.SETTINGS.PROFILE.UNFOLLOW : LABELS.SETTINGS.PROFILE.FOLLOW}
              </Button>
            ) : me?.id === user?.id ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (me?.role === UserRole.ADMIN) router.push('/admin');
                    else if (me?.role === UserRole.RESTAURANT) router.push('/restaurant-admin');
                    else router.push('/dashboard');
                  }}
                >
                  <Grid size={18} className="mr-2" /> {LABELS.SETTINGS.PROFILE.DASHBOARD}
                </Button>
                <Button variant="secondary" onClick={onEdit}>
                  <Edit3 size={18} className="mr-2" /> {LABELS.COMMON.EDIT}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
