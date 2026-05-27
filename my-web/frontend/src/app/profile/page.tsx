/**
 * Mục đích file này để làm gì: Đây là trang Profile chính của người dùng, đóng vai trò Orchestrator lắp ráp các module giao diện (ProfileHeader, ProfileIntro, Modals).
 * Các file khác hay file này có ý nghĩa như nào: Tách biệt hoàn toàn UI và logic, nhường toàn bộ xử lý state/gọi API cho hook `useProfileData`. Các Component con trong `features/` đảm nhận phần hiển thị chi tiết.
 * Các chức năng đặc biệt: Bọc `Suspense` an toàn cho `useSearchParams` (chuẩn Next.js App Router). Quản lý render động nhiều Tab và Modal (Followers, Following, Edit Profile).
 * Các biến, hàm đặc biệt trong file: `ProfileContent` (chứa logic bóc tách URL Params), Component `ProfilePage` (bọc ngoài Suspense).
 */
'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

// Services & Components
import { useProfileData } from '@/hooks/useProfileData';
import { User } from '@/types/user';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';

// Modular Feature Components
import { ProfileHeader } from '@/components/features/profile/ProfileHeader';
import { ProfileIntro } from '@/components/features/profile/ProfileIntro';
import { EditProfileModal } from '@/components/features/profile/EditProfileModal';
import { FollowersModal } from '@/components/features/profile/FollowersModal';
import { FollowingModal } from '@/components/features/profile/FollowingModal';

function ProfileContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const {
    me,
    profile,
    loading,
    isFollowLoading,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    actions,
    modals
  } = useProfileData(targetId);

  const router = useRouter();

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 text-foreground gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
    </div>
  );

  const user = profile;

  return (
    <div className="min-h-screen bg-gray-50 text-foreground transition-colors duration-300">
      <Navbar activeTab="profile" setActiveTab={() => {}} />

      <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
        <ProfileHeader 
          user={user} 
          profile={profile} 
          me={me as User | null} 
          isFollowLoading={isFollowLoading} 
          onEdit={() => setIsEditing(true)} 
          onFollow={actions.toggleFollow} 
          onShowFollowers={actions.openFollowersModal}
          onShowFollowing={actions.openFollowingModal}
        />

        <div className="flex items-center mt-6 border-b border-gray-100 dark:border-gray-200 bg-white dark:bg-gray-100 rounded-t-card px-4 md:px-8 transition-colors duration-300">
          {[
            { id: 'posts', label: LABELS.SETTINGS.PROFILE.TABS.POSTS },
            { id: 'about', label: LABELS.SETTINGS.PROFILE.TABS.ABOUT },
            { id: 'friends', label: LABELS.SETTINGS.PROFILE.TABS.FRIENDS },
            { id: 'photos', label: LABELS.SETTINGS.PROFILE.TABS.PHOTOS },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-8 py-4 font-bold text-small transition-all border-b-4 ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          <div className="md:col-span-5 space-y-6">
            <ProfileIntro profile={profile} user={user} me={me as User | null} onEdit={() => setIsEditing(true)} />
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="card-container !p-6">
              <div className="flex gap-4 mb-4">
                <Avatar src={profile.profile?.avatar} name={user.name} size={40} />
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-full px-6 py-2 text-left text-gray-500 transition-all text-small">
                  {LABELS.SETTINGS.PROFILE.POSTS.THINKING(user.name)}
                </button>
              </div>
            </div>

            <div className="card-container !p-12 text-center border-2 border-dashed !border-gray-100">
               <Info size={48} className="mx-auto text-gray-200 mb-4" />
               <h3 className="text-lg font-bold text-gray-400">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_TITLE}</h3>
               <p className="text-gray-400 text-small">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_DESC}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <EditProfileModal 
            key="edit-profile-modal"
            isOpen={isEditing} 
            onClose={() => setIsEditing(false)} 
            editData={editData} 
            setEditData={setEditData} 
            loading={loading} 
            onSave={actions.updateProfile} 
            role={me?.role}
          />
        )}
      </AnimatePresence>

      {/* Modal Followers */}
      <AnimatePresence>
        {modals.showFollowersModal && (
          <FollowersModal
            isOpen={modals.showFollowersModal}
            onClose={() => modals.setShowFollowersModal(false)}
            loading={modals.loadingFollowers}
            error={modals.errorFollowers}
            followersList={modals.followersList}
            onItemClick={(followerUser: any) => {
              modals.setShowFollowersModal(false);
              router.push(`/profile?id=${followerUser.id}`);
            }}
            title={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWERS_TITLE}
            emptyLabel={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWERS_EMPTY}
          />
        )}
      </AnimatePresence>

      {/* Modal Following */}
      <AnimatePresence>
        {modals.showFollowingModal && (
          <FollowingModal
            isOpen={modals.showFollowingModal}
            onClose={() => modals.setShowFollowingModal(false)}
            loading={modals.loadingFollowing}
            error={modals.errorFollowing}
            users={modals.followingList.users}
            restaurants={modals.followingList.restaurants}
            onUserClick={(followingUser: any) => {
              modals.setShowFollowingModal(false);
              router.push(`/profile?id=${followingUser.id}`);
            }}
            onRestaurantClick={(restaurantItem: any) => {
              modals.setShowFollowingModal(false);
              router.push(`/restaurant/${restaurantItem.id}`);
            }}
            title={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWING_TITLE}
            emptyLabel={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWING_EMPTY}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 text-foreground gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
