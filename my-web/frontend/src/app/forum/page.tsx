'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Info, Plus, Award, Star, Flame, Trophy, Shield, Clock } from 'lucide-react';

// Services & Components
import { useAuth } from '@/hooks/useAuth';
import { useProfileData } from '@/hooks/useProfileData';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { socialService } from '@/services/social.service';
import { addNotification } from '@/utils/notifications';
import { User, UserRole } from '@/types/user';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';
import { Avatar } from '@/components/base/Avatar';
import { toast } from '@/store/useToastStore';

// Modular Feature Components
import { PostCard, PostData } from '@/components/features/profile/PostCard';
import { CreatePostModal } from '@/components/features/profile/CreatePostModal';
import { ReportModal } from '@/components/features/profile/ReportModal';

const DEFAULT_POSTS: PostData[] = [];

export default function ForumPage() {
  const { user: me, login } = useAuth();
  const { profile, actions } = useProfileData(me?.id ? String(me.id) : null);
  const router = useRouter();

  // Social Feed local states
  const [posts, setPosts] = useState<PostData[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'POST' | 'COMMENT'>('POST');

  // Load posts
  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await socialService.getPosts();
        setPosts(data || []);
      } catch (err) {
        console.error('Error loading posts:', err);
      }
    }
    loadPosts();
  }, []);

  // Fetch following list
  useEffect(() => {
    if (me?.id) {
      authService.getFollowing(me.id)
        .then((data: { users?: { id: number }[]; restaurants?: { id: number }[] }) => {
          const followedUserIds = data?.users?.map((u) => u.id) || [];
          const followedRestaurantIds = data?.restaurants?.map((u) => u.id) || [];
          setFollowingIds([...followedUserIds, ...followedRestaurantIds]);
        })
        .catch(err => console.error('Lỗi lấy danh sách theo dõi:', err));
    }
  }, [me?.id]);

  // Load Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const users = await userService.getLeaderboard();
        setLeaderboard(users || []);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    fetchLeaderboard();
  }, []);

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

  // Social interactions handlers
  const handleCreatePost = async (newPost: any) => {
    toast.success(LABELS.SOCIAL.POST_SUCCESS);
    try {
      const data = await socialService.getPosts();
      setPosts(data || []);
    } catch (err) {
      console.error(err);
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
    if (!profile) {
      toast.error(LABELS.SOCIAL.TOAST.LOGIN_REQUIRED_SHARE);
      return;
    }

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
      
      const data = await socialService.getPosts();
      setPosts(data || []);

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
      <Navbar activeTab="forum" setActiveTab={() => {}} />

      {/* Hero Header Section */}
      <div className="pt-28 pb-12 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b border-orange-500/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
              <Flame className="text-primary animate-pulse" size={36} />
              {LABELS.SOCIAL.FEED_TITLE}
            </h1>
            <p className="text-gray-500 text-small max-w-xl font-medium">
              {LABELS.SOCIAL.FEED_DESC}
            </p>
          </div>
          {profile && (
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-6 py-3 bg-primary text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Chia sẻ trải nghiệm
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Feed Column (Left) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Write Post Trigger Card */}
            {profile && (
              <div className="card-container !p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl shadow-sm">
                <div className="flex gap-4">
                  <Avatar src={profile.profile?.avatar} name={me?.name} size={40} />
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex-1 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full px-6 py-2.5 text-left text-gray-500 transition-all text-small font-bold flex items-center justify-between border border-gray-100 dark:border-slate-800"
                  >
                    <span>{me?.name} ơi, hôm nay bạn ăn món gì ngon thế?</span>
                    <Plus size={18} className="text-primary" />
                  </button>
                </div>
              </div>
            )}

            {/* Feed List */}
            {(() => {
              const forumPosts = posts.filter((post) => {
                if (post.isShared) return false;
                if (post.postType === 'REVIEW') return true;
                if (post.postType === 'NORMAL') {
                  const authorId = post.author?.id;
                  if (!authorId) return true;
                  return me?.id === authorId || followingIds.includes(authorId);
                }
                return true;
              });

              return forumPosts.length === 0 ? (
                <div className="card-container !p-16 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                  <Info size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-400">Diễn đàn chưa có bài đăng nào</h3>
                  <p className="text-gray-400 text-small mt-1">Theo dõi thêm thực khách khác hoặc viết review quán để xem tin mới!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {forumPosts.map((post) => (
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

          {/* Sidebar Column (Right) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Personal Status Card */}
            {profile ? (
              <div className="card-premium p-6 space-y-5 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-500/10">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                  <Avatar src={profile.profile?.avatar} name={me?.name} size={60} className="border-2 border-white shadow" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-gray-800 dark:text-white truncate text-base">{me?.name}</h4>
                    <span className="text-mini font-bold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md mt-1 inline-block">
                      ✨ {profile.badgeTitle || 'Thành viên mới'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Cấp Độ</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white mt-1 block">Lv. {profile.level || 1}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Điểm tích lũy</span>
                    <span className="text-xl font-black text-amber-500 mt-1 block">⭐ {profile.points || 0}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-mini text-gray-500 mb-1.5 font-bold">
                    <span>Tiến độ cấp độ</span>
                    <span>{(profile.points || 0) % 1000} / 1000 XP</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-gray-200/50 dark:border-slate-700">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, ((profile.points || 0) % 1000) / 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-premium p-6 text-center space-y-4">
                <Info size={32} className="text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-700">Tham gia cộng đồng</h4>
                <p className="text-xs text-gray-400">Đăng nhập tài khoản của bạn để viết bài, thả tim và thảo luận cùng các thực khách khác.</p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow hover:shadow-md transition-all text-xs"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* Leaderboard Card */}
            <div className="card-premium p-6 space-y-5">
              <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                <Trophy className="text-yellow-500 animate-bounce" size={20} />
                Thực Thần Tiêu Biểu
              </h3>

              {loadingLeaderboard ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-800" />
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Chưa có bảng xếp hạng.</p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((item, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;
                    return (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/profile?id=${item.id}`)}
                        className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-900/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank number or medal */}
                          <span className="w-6 font-black text-center text-xs">
                            {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `${idx + 1}`}
                          </span>
                          <Avatar src={item.avatar || item.profile?.avatar} name={item.name} size={36} />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-gray-800 dark:text-white truncate text-xs">{item.name}</h4>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              Lv. {item.level || 1} • {item.badgeTitle || 'Mới'}
                            </span>
                          </div>
                        </div>
                        <span className="text-mini font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10 shrink-0">
                          ⭐ {item.points || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Create Post Modal */}
      {profile && (
        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onCreated={handleCreatePost}
        />
      )}

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

      <Footer />
    </div>
  );
}
