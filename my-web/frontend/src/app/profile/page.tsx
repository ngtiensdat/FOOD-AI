/**
 * Mục đích file này để làm gì: Đây là trang Profile chính của người dùng, đóng vai trò Orchestrator lắp ráp các module giao diện (ProfileHeader, ProfileIntro, Modals, Chợ Voucher, Bảng tin ẩm thực).
 * Các file khác hay file này có ý nghĩa như nào: Kết nối Custom Hook useProfileData để cập nhật dữ liệu tài khoản và đồng bộ giao diện người dùng.
 * Các chức năng đặc biệt: Tích hợp hệ thống mạng xã hội (đăng bài review, thả tim, bình luận, báo cáo vi phạm), thăng cấp tích điểm và đổi voucher giảm giá.
 */
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Info, Plus, Star } from 'lucide-react';

// Services & Components
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/hooks/useAuth';
import { useSocialActions } from '@/hooks/useSocialActions';
import { User, UserRole } from '@/types/user';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LevelUpModal } from '@/components/features/badges/LevelUpModal';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';
import { toast } from '@/store/useToastStore';
import { addNotification } from '@/utils/notifications';
import { socialService } from '@/services/social.service';
import { Button } from '@/components/base/Button';

// Modular Feature Components
import { ProfileHeader } from '@/components/features/profile/ProfileHeader';
import { ProfileIntro } from '@/components/features/profile/ProfileIntro';
import { EditProfileModal } from '@/components/features/profile/EditProfileModal';
import { FollowersModal } from '@/components/features/profile/FollowersModal';
import { FollowingModal } from '@/components/features/profile/FollowingModal';
import { VoucherMallTab } from '@/components/features/profile/VoucherMallTab';
import { CreatePostModal } from '@/components/features/profile/CreatePostModal';
import { PostCard, PostData } from '@/components/features/profile/PostCard';
import { ReportModal } from '@/components/features/profile/ReportModal';

const DEFAULT_POSTS: PostData[] = [];

function ProfileContent() {
  const { login } = useAuth();
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

  // Social Feed local states
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Load posts
  useEffect(() => {
    async function loadAuthorPosts() {
      const idToFetch = targetId ? parseInt(targetId) : me?.id;
      if (idToFetch) {
        try {
          const data = await socialService.getPosts(idToFetch);
          setPosts(data || []);
        } catch (err) {
          console.error('Lỗi khi tải bài đăng của tác giả:', err);
        }
      }
    }
    loadAuthorPosts();
  }, [targetId, me?.id]);



  // Centralized social interactions & reports hook
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportTargetId,
    setReportTargetId,
    reportTargetType,
    setReportTargetType,
    handleCreatePost,
    handleLike,
    handleComment,
    handleOpenReport,
    handleReportSubmitted,
    handleShare,
    handleDeleteComment,
    handleReplyComment,
    handleDeleteReply,
    handleDeletePost,
    isLevelUpModalOpen,
    setIsLevelUpModalOpen,
    levelUpData,
  } = useSocialActions({
    posts,
    setPosts,
    profile,
    me,
    actions,
    login,
    isProfilePage: true,
    targetId,
  });

  if (!profile) return (
    <div className="page-loading">
      <div className="loading-spinner h-12 w-12"></div>
      <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
    </div>
  );

  const user = profile;

  // Point update callback from Voucher Mall
  const handleUpdatePointsFromRedeem = async (newPoints: number) => {
    if (profile?.id) {
      try {
        const updatedProfile = await actions.fetchProfileData(profile.id, me?.id);
        if (updatedProfile) {
          actions.setProfile(updatedProfile);
          if (me && me.id === profile.id) {
            login({
              ...me,
              points: updatedProfile.points,
              level: updatedProfile.level,
              badgeTitle: updatedProfile.badgeTitle,
            });
          }
        }
      } catch (err) {
        console.error('Lỗi khi đồng bộ điểm sau đổi voucher:', err);
      }
    }
  };



  return (
    <div className="page-container min-h-screen">
      <Navbar activeTab="profile" setActiveTab={() => { }} />

      <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
        <ProfileHeader
          user={user}
          profile={profile}
          me={me}
          isFollowLoading={isFollowLoading}
          onEdit={() => setIsEditing(true)}
          onFollow={actions.toggleFollow}
          onShowFollowers={actions.openFollowersModal}
          onShowFollowing={actions.openFollowingModal}
        />

        {/* Tab Selection Row */}
        <div className="flex items-center mt-6 border-b border-gray-100 dark:border-gray-200 bg-white dark:bg-gray-100 rounded-t-card px-4 md:px-8 transition-colors duration-300">
          {[
            { id: 'posts', label: LABELS.SETTINGS.PROFILE.TABS.POSTS },
            { id: 'loyalty', label: LABELS.LOYALTY.TITLE },
            { id: 'about', label: LABELS.SETTINGS.PROFILE.TABS.ABOUT },
            { id: 'friends', label: LABELS.SETTINGS.PROFILE.TABS.FRIENDS },
            { id: 'photos', label: LABELS.SETTINGS.PROFILE.TABS.PHOTOS },
          ].map(tab => {
            // Only show loyalty tab for Customer role
            if (tab.id === 'loyalty' && profile.role !== 'CUSTOMER') return null;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant="none"
                size="none"
                className={`px-4 md:px-8 py-4 font-bold text-small transition-all border-b-4 ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        {activeTab === 'loyalty' ? (
          <div className="mt-6">
            <VoucherMallTab 
              currentPoints={profile.points || 0}
              onUpdatePoints={handleUpdatePointsFromRedeem}
            />
          </div>
        ) : activeTab === 'posts' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
            {/* Left Column: Intro */}
            <div className="md:col-span-5 space-y-6">
              <ProfileIntro profile={profile} user={user} me={me as User | null} onEdit={() => setIsEditing(true)} />
            </div>

            {/* Right Column: Social Feed */}
            <div className="md:col-span-7 space-y-6">
              {/* Write Post Trigger Card */}
              {me?.id === user.id && (
                <div className="card-container !p-6">
                  <div className="flex gap-4">
                    <Avatar src={profile.profile?.avatar} name={user.name} size={40} />
                    <Button 
                      onClick={() => setIsPostModalOpen(true)}
                      variant="none"
                      size="none"
                      className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-full px-6 py-2.5 text-left text-gray-500 transition-all text-small font-bold flex items-center justify-between border border-gray-100 hover:border-gray-200"
                    >
                      <span>{LABELS.SETTINGS.PROFILE.POSTS.THINKING(user.name)}</span>
                      <Plus size={18} className="text-primary" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Feed List */}
              {(() => {
                const profilePosts = posts.filter(post => post.author?.id === profile.id);
                return profilePosts.length === 0 ? (
                  <div className="card-container !p-12 text-center border-2 border-dashed !border-gray-100">
                    <Info size={48} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-400">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_TITLE}</h3>
                    <p className="text-gray-400 text-small">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_DESC}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profilePosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        me={me}
                        onLike={handleLike}
                        onComment={handleComment}
                        onReport={handleOpenReport}
                        onShare={handleShare}
                        onDeleteComment={handleDeleteComment}
                        onReplyComment={handleReplyComment}
                        onDeleteReply={handleDeleteReply}
                        onDeletePost={handleDeletePost}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* Placeholder for other tabs */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
            <div className="md:col-span-5 space-y-6">
              <ProfileIntro profile={profile} user={user} me={me as User | null} onEdit={() => setIsEditing(true)} />
            </div>
            <div className="md:col-span-7">
              <div className="card-container !p-12 text-center border-2 border-dashed !border-gray-100">
                <Info size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-400">{LABELS.COMMON.DEVELOPING}</h3>
                <p className="text-gray-400 text-small">{LABELS.COMMON.DEVELOPING_DESC}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
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

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onCreated={handleCreatePost}
      />

      {/* Content Violation Report Modal */}
      {isReportModalOpen && reportTargetId && (
        <ReportModal
          isOpen={isReportModalOpen}
          targetId={reportTargetId}
          targetType={reportTargetType}
          currentUserId={me?.id || 0}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitted={handleReportSubmitted}
        />
      )}

      {/* Modal Followers */}
      <AnimatePresence>
        {modals.showFollowersModal && (
          <FollowersModal
            isOpen={modals.showFollowersModal}
            onClose={() => modals.setShowFollowersModal(false)}
            loading={modals.loadingFollowers}
            error={modals.errorFollowers}
            followersList={modals.followersList}
            onItemClick={(followerUser) => {
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
            onUserClick={(followingUser) => {
              modals.setShowFollowingModal(false);
              router.push(`/profile?id=${followingUser.id}`);
            }}
            onRestaurantClick={(restaurantItem) => {
              modals.setShowFollowingModal(false);
              router.push(`/restaurant/${restaurantItem.id}`);
            }}
            title={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWING_TITLE}
            emptyLabel={LABELS.SETTINGS.PROFILE.MODALS.FOLLOWING_EMPTY}
          />
        )}
      </AnimatePresence>

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        level={levelUpData?.level || 1}
        badge={levelUpData?.badge}
      />

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="page-loading">
        <div className="loading-spinner h-12 w-12"></div>
        <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
