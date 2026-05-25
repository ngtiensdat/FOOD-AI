'use client';

import React from 'react';
import Image from 'next/image';
import { Camera, Shield, Store, Grid, Edit3, MoreHorizontal, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { useRouter } from 'next/navigation';
import { getValidImageUrl } from '@/utils/helpers';

interface ProfileHeaderProps {
  user: any;
  profile: any;
  me: any;
  isFollowLoading: boolean;
  onEdit: () => void;
  onFollow: () => void;
}

// Helper to check operating status
const isRestaurantCurrentlyOpen = (openingHours?: string, isActive?: boolean) => {
  if (isActive === false) return false;
  if (!openingHours) return true;

  try {
    const cleanHours = openingHours.replace(/\s+/g, '');
    const match = cleanHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) return true;

    const [, sh, sm, eh, em] = match;
    const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    if (startMin <= endMin) {
      return currentMin >= startMin && currentMin <= endMin;
    } else {
      return currentMin >= startMin || currentMin <= endMin;
    }
  } catch {
    return true;
  }
};

export const ProfileHeader = ({
  user,
  profile,
  me,
  isFollowLoading,
  onEdit,
  onFollow
}: ProfileHeaderProps) => {
  const router = useRouter();
  const restaurant = profile?.restaurants?.[0];
  const isOpen = restaurant 
    ? isRestaurantCurrentlyOpen(restaurant.profile?.openingHours, restaurant.isActive)
    : true;

  return (
    <div className="card-container !p-0 overflow-hidden">
      {/* Cover Photo */}
      <div className="h-64 md:h-96 relative group cursor-pointer overflow-hidden">
        {profile?.profile?.coverImage ? (
          <Image 
            src={getValidImageUrl(profile.profile.coverImage)} 
            alt="Cover" 
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
        {user?.role === 'RESTAURANT' && restaurant && !isOpen && (
          <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
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
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-white transition-transform hover:scale-[1.02]">
              {profile?.profile?.avatar ? (
                <Image src={getValidImageUrl(profile.profile.avatar)} alt="Avatar" fill sizes="(max-width: 768px) 160px, 192px" className="object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-5xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {me?.id === user?.id && (
              <button 
                onClick={onEdit}
                className="absolute bottom-2 right-2 p-2 bg-gray-100 rounded-full border-2 border-white hover:bg-gray-200 transition-all z-10"
                aria-label={LABELS.COMMON.EDIT}
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-h1 !text-4xl md:!text-5xl text-gray-900 mb-2">{user?.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-small font-bold text-gray-500 mb-4">
              {user?.role === 'ADMIN' ? (
                <span className="flex items-center gap-1.5"><Shield size={18} className="text-primary" /> {LABELS.AUTH.ADMIN}</span>
              ) : (
                <>
                  {user?.role === 'RESTAURANT' ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5"><Store size={18} className="text-primary" /> {LABELS.AUTH.RESTAURANT_ROLE}</span>
                      <span className="text-gray-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                        <Clock size={14} />
                        {LABELS.RESTAURANT.OPERATING_HOURS_LABEL}: {restaurant?.profile?.openingHours || LABELS.RESTAURANT.NOT_SET}
                      </span>
                      <span className="text-gray-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isOpen ? LABELS.RESTAURANT.STATUS_OPEN : LABELS.RESTAURANT.STATUS_CLOSED}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>{(profile?.restaurants?.[0]?._count?.followers || 0) + (profile?._count?.userFollowers || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWERS}</span>
                      <span>•</span>
                      <span>{(profile?._count?.userFollowing || 0) + (profile?._count?.follows || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWING}</span>
                    </>
                  )}
                </>
              )}
            </div>
            <p className="text-body text-gray-600 max-w-lg">
              {profile?.profile?.bio || LABELS.SETTINGS.PROFILE.BIO_EMPTY}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {me?.id !== user?.id && user?.role !== 'ADMIN' && me?.role !== 'ADMIN' ? (
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
                    if (me.role === 'ADMIN') router.push('/admin');
                    else if (me.role === 'RESTAURANT') router.push('/restaurant-admin');
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
            <Button variant="outline" className="w-12 h-12 p-0" aria-label={LABELS.COMMON.OTHER}>
              <MoreHorizontal size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
