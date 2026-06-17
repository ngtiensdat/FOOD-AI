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
import { User, UserRole } from '@/types/user';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';
import { toast } from '@/store/useToastStore';
import { addNotification } from '@/utils/notifications';
import { socialService } from '@/services/social.service';

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
  
  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'POST' | 'COMMENT'>('POST');

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



  if (!profile) return (
    <div className="page-loading">
      <div className="loading-spinner h-12 w-12"></div>
      <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
    </div>
  );

  const user = profile;

  // Gamification helper to award points and handle level-ups
  const awardPoints = async (pointsAmount: number, reason: string) => {
    if (!profile) return;
    if (profile.role !== UserRole.CUSTOMER && profile.role !== UserRole.RESTAURANT) return;

    try {
      const updatedProfile = await actions.fetchProfileData(profile.id, me?.id);
      if (updatedProfile) {
        if (profile.level && updatedProfile.level > profile.level) {
          toast.success(LABELS.LOYALTY.LEVEL_UP_SUCCESS(updatedProfile.level));
          addNotification(
            profile.id,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_TITLE,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_BODY(updatedProfile.level),
            'LEVEL_UP',
            '/trophy.png'
          );
        }
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
      console.error('Lỗi khi làm mới profile:', err);
    }

    toast.success(LABELS.LOYALTY.AWARD_POINTS_SUCCESS(pointsAmount, reason));
  };

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

  // Social interactions handlers
  const handleCreatePost = async (newPost: any) => {
    toast.success(LABELS.SOCIAL.POST_SUCCESS);
    const idToFetch = targetId ? parseInt(targetId) : me?.id;
    if (idToFetch) {
      try {
        const data = await socialService.getPosts(idToFetch);
        setPosts(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    awardPoints(50, 'Đăng bài viết mới');
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      await socialService.toggleLike(postId);
      if (isLiked) {
        awardPoints(5, 'Thả tim bài đăng');
        const targetPost = posts.find(p => p.id === postId);
        if (targetPost && targetPost.author?.id && targetPost.author.id !== me?.id) {
          addNotification(
            targetPost.author.id,
            LABELS.SOCIAL.NOTIFICATIONS.LIKE_TITLE,
            LABELS.SOCIAL.NOTIFICATIONS.LIKE_BODY(me?.name || 'Ai đó', targetPost.title || ''),
            'LIKE',
            me?.avatar || undefined
          );
        }
      } else {
        awardPoints(0, 'Bỏ thích bài đăng');
      }
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.INTERACTION_ERROR);
    }
  };

  const handleComment = async (postId: number, commentContent: string) => {
    try {
      const newComment = await socialService.createComment(postId, { content: commentContent });
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      }));

      awardPoints(10, 'Bình luận bài viết');
      const targetPost = posts.find(p => p.id === postId);
      if (targetPost && targetPost.author?.id && targetPost.author.id !== me?.id) {
        addNotification(
          targetPost.author.id,
          LABELS.SOCIAL.NOTIFICATIONS.COMMENT_TITLE,
          LABELS.SOCIAL.NOTIFICATIONS.COMMENT_BODY(me?.name || 'Ai đó', targetPost.title || ''),
          'COMMENT',
          me?.avatar || undefined
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.COMMENT_ERROR);
    }
  };

  const handleOpenReport = (targetId: number, targetType: 'POST' | 'COMMENT') => {
    setReportTargetId(targetId);
    setReportTargetType(targetType);
    setIsReportModalOpen(true);
  };

  const handleReportSubmitted = () => {
    toast.success(LABELS.MODERATION.REPORT_SUBMITTED);
  };

  const handleShare = async (postToShare: PostData) => {
    if (!profile) return;

    try {
      await socialService.createPost({
        title: postToShare.title,
        content: postToShare.content,
        postType: postToShare.postType,
        rating: postToShare.rating || undefined,
        image: postToShare.image || undefined,
        restaurantId: postToShare.restaurant?.id || undefined,
        foodId: postToShare.food?.id || undefined,
        isShared: true,
        sharedFromId: postToShare.id
      });

      toast.success(LABELS.SOCIAL.TOAST.SHARE_SUCCESS);
      
      const idToFetch = targetId ? parseInt(targetId) : me?.id;
      if (idToFetch) {
        const data = await socialService.getPosts(idToFetch);
        setPosts(data || []);
      }

      awardPoints(15, 'Chia sẻ bài viết');

      if (postToShare.author?.id && postToShare.author.id !== me?.id) {
        addNotification(
          postToShare.author.id,
          LABELS.SOCIAL.NOTIFICATIONS.SHARE_TITLE,
          LABELS.SOCIAL.NOTIFICATIONS.SHARE_BODY(me?.name || 'Ai đó', postToShare.title || ''),
          'SHARE',
          me?.avatar || undefined
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.SHARE_ERROR);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await socialService.deleteComment(commentId);
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          const comment = p.comments.find(c => c.id === commentId);
          const repliesCount = comment?.replies?.length || 0;
          return {
            ...p,
            commentsCount: Math.max(0, p.commentsCount - 1 - repliesCount),
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
      toast.success(LABELS.SOCIAL.TOAST.COMMENT_DELETE_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.COMMENT_DELETE_ERROR);
    }
  };

  const handleReplyComment = async (postId: number, commentId: number, replyContent: string) => {
    try {
      const newReply = await socialService.createComment(postId, { content: replyContent, parentId: commentId });
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: p.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newReply]
                };
              }
              return c;
            })
          };
        }
        return p;
      }));
      toast.success(LABELS.SOCIAL.TOAST.REPLY_SUCCESS);
      awardPoints(5, 'Trả lời bình luận');

      const targetPost = posts.find(p => p.id === postId);
      if (targetPost) {
        const targetComment = targetPost.comments.find(c => c.id === commentId);
        if (targetComment && targetComment.userId && targetComment.userId !== me?.id) {
          addNotification(
            targetComment.userId,
            LABELS.SOCIAL.NOTIFICATIONS.REPLY_TITLE,
            LABELS.SOCIAL.NOTIFICATIONS.REPLY_BODY(me?.name || 'Ai đó', targetPost.title || ''),
            'REPLY',
            me?.avatar || undefined
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.REPLY_ERROR);
    }
  };

  const handleDeleteReply = async (postId: number, commentId: number, replyId: number) => {
    try {
      await socialService.deleteComment(replyId);
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: Math.max(0, p.commentsCount - 1),
            comments: p.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: (c.replies || []).filter(r => r.id !== replyId)
                };
              }
              return c;
            })
          };
        }
        return p;
      }));
      toast.success(LABELS.SOCIAL.TOAST.REPLY_DELETE_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.REPLY_DELETE_ERROR);
    }
  };

  return (
    <div className="page-container min-h-screen">
      <Navbar activeTab="profile" setActiveTab={() => { }} />

      <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
        <ProfileHeader
          user={user}
          profile={profile}
          me={me as any}
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
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-8 py-4 font-bold text-small transition-all border-b-4 ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
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
                    <button 
                      onClick={() => setIsPostModalOpen(true)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-full px-6 py-2.5 text-left text-gray-500 transition-all text-small font-bold flex items-center justify-between border border-gray-100 hover:border-gray-200"
                    >
                      <span>{LABELS.SETTINGS.PROFILE.POSTS.THINKING(user.name)}</span>
                      <Plus size={18} className="text-primary" />
                    </button>
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
