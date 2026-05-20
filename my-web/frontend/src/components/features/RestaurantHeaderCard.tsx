'use client';

import React from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  UserCheck, 
  Lock, 
  Settings 
} from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface RestaurantHeaderCardProps {
  restaurantData: any;
  isOwner: boolean;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  showFollowList: boolean;
  handleToggleFollow: () => void;
  openFollowersModal: () => void;
  openFollowingModal: () => void;
  onBack: () => void;
}

export const RestaurantHeaderCard = ({
  restaurantData,
  isOwner,
  isFollowing,
  followersCount,
  followingCount,
  showFollowList,
  handleToggleFollow,
  openFollowersModal,
  openFollowingModal,
  onBack,
}: RestaurantHeaderCardProps) => {
  const coverBg = restaurantData.profile?.coverImage 
    ? `url(${restaurantData.profile.coverImage})`
    : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';

  return (
    <>
      {isOwner && (
        <div className="bg-primary/10 border-b border-primary/20 text-primary py-3.5 px-6 text-center text-small font-bold flex items-center justify-center gap-2 mt-20 relative z-10 transition-colors">
          <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.VIEWING_AS_GUEST}</span>
          <button 
            onClick={() => window.location.href = '/restaurant-admin'}
            className="underline hover:text-primary-dark transition-colors font-extrabold"
          >
            [Vào trang quản trị]
          </button>
        </div>
      )}

      {/* Hero Banner Cover */}
      <div 
        className={`w-full h-80 md:h-96 bg-cover bg-center relative ${isOwner ? 'mt-0' : 'mt-20'}`}
        style={{ backgroundImage: coverBg }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10 max-w-7xl mx-auto w-full px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/40 border-white/20 text-white backdrop-blur-md transition-all duration-300"
          >
            <ArrowLeft size={24} />
          </Button>
        </div>
      </div>

      {/* Restaurant Header Details */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10 pb-1">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-card p-6 md:p-8 border border-white/20 dark:border-slate-800/30 shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-h1 font-extrabold shrink-0 shadow-inner">
                {restaurantData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-h1 font-black text-gray-900 mb-2">{restaurantData.name}</h1>
                <div className="flex items-center gap-2 text-gray-500 text-small font-semibold">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span>{restaurantData.address}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Follow Stats Container */}
              <div className="flex items-center gap-6 bg-gray-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                <button 
                  onClick={openFollowersModal}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-h3 font-black text-gray-900">{followersCount}</span>
                  <span className="text-small text-gray-400 font-bold flex items-center gap-1">
                    {showFollowList ? <Users size={12} /> : <Lock size={12} />}
                    {LABELS.SETTINGS.PROFILE.FOLLOWERS}
                  </span>
                </button>
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
                <button 
                  onClick={openFollowingModal}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-h3 font-black text-gray-900">{followingCount}</span>
                  <span className="text-small text-gray-400 font-bold flex items-center gap-1">
                    {showFollowList ? <Users size={12} /> : <Lock size={12} />}
                    {LABELS.SETTINGS.PROFILE.FOLLOWING}
                  </span>
                </button>
              </div>

              {/* Follow Action Button or Manage Button */}
              {isOwner ? (
                <Button
                  variant="outline"
                  className="rounded-2xl px-6 py-3.5 font-bold flex items-center gap-2 border-primary text-primary hover:bg-primary/5 transition-all shadow-sm w-full md:w-auto text-center justify-center"
                  onClick={() => window.location.href = '/restaurant-admin'}
                >
                  <Settings size={18} />
                  <span>Quản lý quán ăn</span>
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  className="rounded-2xl px-6 py-3.5 font-bold flex items-center gap-2 shadow-sm w-full md:w-auto text-center justify-center transition-all duration-300"
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={18} />
                      <span>{LABELS.SETTINGS.PROFILE.UNFOLLOW}</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>{LABELS.SETTINGS.PROFILE.FOLLOW}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {restaurantData.description && (
            <p className="mt-6 text-body text-gray-600 border-t border-gray-100 dark:border-slate-800 pt-6 leading-relaxed italic">
              &ldquo;{restaurantData.description}&rdquo;
            </p>
          )}
        </div>
      </div>
    </>
  );
};
