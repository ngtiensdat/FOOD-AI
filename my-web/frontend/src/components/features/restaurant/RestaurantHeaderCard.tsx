// Mục đích file này để làm gì: Component Header hiển thị thông tin tổng quan của nhà hàng (ảnh bìa, avatar, tên, địa chỉ, lượt theo dõi).
// Các file khác hay file này có ý nghĩa như nào: Nằm ở phần đầu của trang public profile nhà hàng, giúp người dùng nhận diện và thực hiện các thao tác nhanh (theo dõi/bỏ theo dõi, quản lý).
// Các chức năng đặc biệt: Hiển thị giao diện khác biệt theo vai trò (chủ nhà hàng vs khách), có fallback cho cover image, thống kê người theo dõi và các nút hành động.
// Các biến, hàm đặc biệt trong file: Nhận dữ liệu nhà hàng qua props, có các cờ isOwner, isFollowing và các hàm xử lý hành động tương tác như handleToggleFollow, onBack.
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
import { Avatar } from '@/components/base/Avatar';
import { LABELS } from '@/constants/labels';
import { getGoogleMapsUrl } from '@/utils/helpers';

interface RestaurantHeaderCardProps {
  restaurantData: {
    name: string;
    address?: string;
    mapUrl?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    description?: string;
    ratingAvg?: number | null;
    ratingCount?: number | null;
    profile?: {
      coverImage?: string | null;
    } | null;
    [key: string]: unknown;
  };
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

const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';

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
    : DEFAULT_COVER_GRADIENT;

  const badgeTitle = (restaurantData.owner as any)?.badgeTitle || (restaurantData as any).merchantBadge;
  const mapUrl = getGoogleMapsUrl(
    restaurantData.latitude,
    restaurantData.longitude,
    restaurantData.mapUrl,
    restaurantData.name,
    restaurantData.address
  );

  return (
    <>
      {isOwner && (
        <div className="bg-primary/10 border-b border-primary/20 text-primary py-3.5 px-6 text-center text-small font-bold flex items-center justify-center gap-2 mt-20 relative z-10 transition-colors">
          <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.VIEWING_AS_GUEST}</span>
          <Button 
            onClick={() => window.location.href = '/restaurant-admin'}
            className="underline hover:text-primary-dark transition-colors font-extrabold"
            variant="none"
            size="none"
          >
            {LABELS.RESTAURANT.PUBLIC_PROFILE.GO_TO_ADMIN}
          </Button>
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
              <div className="hidden md:block">
                <Avatar 
                  name={restaurantData.name} 
                  size={96} 
                  className="rounded-3xl bg-primary/10 border-2 border-primary/20 shadow-inner"
                  fallbackClassName="text-primary text-h1 font-extrabold !bg-transparent"
                />
              </div>
              <div className="md:hidden">
                <Avatar 
                  name={restaurantData.name} 
                  size={80} 
                  className="rounded-3xl bg-primary/10 border-2 border-primary/20 shadow-inner"
                  fallbackClassName="text-primary text-h1 font-extrabold !bg-transparent"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1 className="text-h1 font-black text-gray-900 mb-0">{restaurantData.name}</h1>
                  {badgeTitle && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider shrink-0">
                      {badgeTitle}
                    </span>
                  )}
                </div>
                {restaurantData.ratingAvg !== undefined && restaurantData.ratingAvg !== null && (
                  <div className="flex items-center gap-1.5 text-sm text-yellow-500 font-extrabold mb-2">
                    <span>⭐</span>
                    <span>{Number(restaurantData.ratingAvg).toFixed(1)}</span>
                    <span className="text-gray-400 font-bold">{LABELS.RESTAURANT.CARD_LABELS.REVIEWS_COUNT(Number(restaurantData.ratingCount) || 0)}</span>
                  </div>
                )}
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-500 hover:text-primary hover:underline text-small font-semibold transition-colors"
                  >
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span>{restaurantData.address}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 text-small font-semibold">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span>{restaurantData.address}</span>
                  </div>
                )}
                {Array.isArray(restaurantData.cuisines) && restaurantData.cuisines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {restaurantData.cuisines.map((cuisine: string) => (
                      <span
                        key={cuisine}
                        className="bg-orange-50/80 dark:bg-orange-950/15 text-primary border border-orange-100/50 dark:border-orange-900/30 px-2.5 py-0.5 rounded-md text-xs font-bold capitalize"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Follow Stats Container */}
              <div className="flex items-center gap-6 bg-gray-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                <Button 
                  onClick={openFollowersModal}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                  variant="none"
                  size="none"
                >
                  <span className="text-h3 font-black text-gray-900">{followersCount}</span>
                  <span className="text-small text-gray-400 font-bold flex items-center gap-1">
                    {showFollowList ? <Users size={12} /> : <Lock size={12} />}
                    {LABELS.SETTINGS.PROFILE.FOLLOWERS}
                  </span>
                </Button>
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
                <Button 
                  onClick={openFollowingModal}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                  variant="none"
                  size="none"
                >
                  <span className="text-h3 font-black text-gray-900">{followingCount}</span>
                  <span className="text-small text-gray-400 font-bold flex items-center gap-1">
                    {showFollowList ? <Users size={12} /> : <Lock size={12} />}
                    {LABELS.SETTINGS.PROFILE.FOLLOWING}
                  </span>
                </Button>
              </div>

              {/* Follow Action Button or Manage Button */}
              {isOwner ? (
                <Button
                  variant="outline"
                  className="rounded-2xl px-6 py-3.5 font-bold flex items-center gap-2 border-primary text-primary hover:bg-primary/5 transition-all shadow-sm w-full md:w-auto text-center justify-center"
                  onClick={() => window.location.href = '/restaurant-admin'}
                >
                  <Settings size={18} />
                  <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.MANAGE_RESTAURANT}</span>
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
