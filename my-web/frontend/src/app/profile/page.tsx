'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { authService } from '@/services/auth.service';

// Services & Components
import { useProfileData } from '@/hooks/useProfileData';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/helpers';

// Modular Feature Components
import { ProfileHeader } from '@/components/features/ProfileHeader';
import { ProfileIntro } from '@/components/features/ProfileIntro';
import { EditProfileModal } from '@/components/features/EditProfileModal';
import { FollowersModal } from '@/components/features/FollowersModal';
import { FollowingModal } from '@/components/features/FollowingModal';

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
    actions
  } = useProfileData(targetId);

  const router = useRouter();

  // Trạng thái cho Modals hiển thị Followers và Following
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any>({ users: [], restaurants: [] });
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorFollowers, setErrorFollowers] = useState<string | null>(null);
  const [errorFollowing, setErrorFollowing] = useState<string | null>(null);

  // Đóng modals tự động khi id profile mục tiêu thay đổi
  React.useEffect(() => {
    Promise.resolve().then(() => {
      setShowFollowersModal(false);
      setShowFollowingModal(false);
    });
  }, [targetId]);

  const openFollowersModal = async () => {
    setShowFollowersModal(true);
    setLoadingFollowers(true);
    setErrorFollowers(null);
    try {
      const data = await authService.getFollowers(profile.id);
      setFollowersList(data || []);
    } catch (err: any) {
      setErrorFollowers(err.response?.data?.message || 'Danh sách này là riêng tư hoặc đã bị ẩn.');
    } finally {
      setLoadingFollowers(false);
    }
  };

  const openFollowingModal = async () => {
    setShowFollowingModal(true);
    setLoadingFollowing(true);
    setErrorFollowing(null);
    try {
      const data = await authService.getFollowing(profile.id);
      setFollowingList(data || { users: [], restaurants: [] });
    } catch (err: any) {
      setErrorFollowing(err.response?.data?.message || 'Danh sách này là riêng tư hoặc đã bị ẩn.');
    } finally {
      setLoadingFollowing(false);
    }
  };

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
          me={me} 
          isFollowLoading={isFollowLoading} 
          onEdit={() => setIsEditing(true)} 
          onFollow={actions.toggleFollow} 
          onShowFollowers={openFollowersModal}
          onShowFollowing={openFollowingModal}
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
            <ProfileIntro profile={profile} user={user} me={me} onEdit={() => setIsEditing(true)} />
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="card-container !p-6">
              <div className="flex gap-4 mb-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white font-bold">
                  {profile.profile?.avatar ? (
                    <Image src={getValidImageUrl(profile.profile.avatar)} alt={user.name} fill sizes="40px" className="object-cover" />
                  ) : user.name?.charAt(0).toUpperCase()}
                </div>
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
          />
        )}
      </AnimatePresence>

      {/* Modal Followers */}
      <AnimatePresence>
        {showFollowersModal && (
          <FollowersModal
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            loading={loadingFollowers}
            error={errorFollowers}
            followersList={followersList}
            onItemClick={(followerUser) => {
              setShowFollowersModal(false);
              router.push(`/profile?id=${followerUser.id}`);
            }}
            title="Người theo dõi"
            emptyLabel="Chưa có người theo dõi nào"
          />
        )}
      </AnimatePresence>

      {/* Modal Following */}
      <AnimatePresence>
        {showFollowingModal && (
          <FollowingModal
            isOpen={showFollowingModal}
            onClose={() => setShowFollowingModal(false)}
            loading={loadingFollowing}
            error={errorFollowing}
            users={followingList.users}
            restaurants={followingList.restaurants}
            onUserClick={(followingUser) => {
              setShowFollowingModal(false);
              router.push(`/profile?id=${followingUser.id}`);
            }}
            onRestaurantClick={(restaurantItem) => {
              setShowFollowingModal(false);
              router.push(`/restaurant/${restaurantItem.id}`);
            }}
            title="Đang theo dõi"
            emptyLabel="Chưa theo dõi ai"
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
