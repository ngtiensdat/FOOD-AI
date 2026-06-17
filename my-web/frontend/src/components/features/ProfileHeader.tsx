'use client';

import React from 'react';
import Image from 'next/image';
import { Camera, Shield, Store, Grid, Edit3, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  user: any;
  profile: any;
  me: any;
  isFollowLoading: boolean;
  onEdit: () => void;
  onFollow: () => void;
}

export const ProfileHeader = ({
  user,
  profile,
  me,
  isFollowLoading,
  onEdit,
  onFollow
}: ProfileHeaderProps) => {
  const router = useRouter();

  return (
    <div className="card-container !p-0 overflow-hidden">
      {/* Cover Photo */}
      <div className="h-64 md:h-96 relative group cursor-pointer overflow-hidden">
        {profile?.profile?.coverImage ? (
          <Image 
            src={profile.profile.coverImage} 
            alt="Cover" 
            fill 
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
        <div className="relative flex flex-col md:flex-row items-center gap-8 mb-10">
          {/* Avatar Section */}
          <div className="relative group -mt-24 md:-mt-32">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-white transition-transform hover:scale-[1.02]">
              {profile?.profile?.avatar ? (
                <Image src={profile.profile.avatar} alt="Avatar" fill className="object-cover" />
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
                  {user?.role === 'RESTAURANT' && (
                    <span className="flex items-center gap-1.5"><Store size={18} className="text-primary" /> {LABELS.AUTH.RESTAURANT_ROLE}</span>
                  )}
                  <span>{(profile?.restaurants?.[0]?._count?.followers || 0) + (profile?._count?.userFollowers || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWERS}</span>
                  <span>•</span>
                  <span>{(profile?._count?.userFollowing || 0) + (profile?._count?.follows || 0)} {LABELS.SETTINGS.PROFILE.FOLLOWING}</span>
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
