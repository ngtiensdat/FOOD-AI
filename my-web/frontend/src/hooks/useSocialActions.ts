// Mục đích: Định nghĩa React Custom Hook useSocialActions dùng chung cho Forum và Profile.
// Ý nghĩa: Loại bỏ trùng lặp code (DRY Violation), đóng gói toàn bộ logic tương tác mạng xã hội.
// Các chức năng đặc biệt: Tích lũy điểm thưởng (awardPoints) khi tương tác, gửi thông báo real-time qua WebSocket.

import { useState } from 'react';
import { socialService } from '@/services/social.service';
import { addNotification } from '@/utils/notifications';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { PostData } from '@/components/features/profile/PostCard';
import { User } from '@/types/user';
import { apiClient } from '@/lib/api-client';

export interface UseSocialActionsParams {
  posts: PostData[];
  setPosts: React.Dispatch<React.SetStateAction<PostData[]>>;
  profile: User | null;
  me: Partial<User> | null;
  actions: {
    fetchProfileData: (id: number, requesterId?: number) => Promise<User | null>;
    setProfile: (profile: User | null) => void;
  };
  login: (user: Partial<User>) => void;
  isProfilePage: boolean;
  targetId?: string | null;
}

export const useSocialActions = ({
  posts,
  setPosts,
  profile,
  me,
  actions,
  login,
  isProfilePage,
  targetId,
}: UseSocialActionsParams) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'POST' | 'COMMENT'>('POST');

  const [levelUpData, setLevelUpData] = useState<{ level: number; badge?: string | null } | null>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);

  // Gamification helper to award points and handle level-ups
  const awardPoints = async (reason: string) => {
    if (!me?.id) return;

    try {
      // 1. Fetch updated data for the logged-in user (me) to see point changes
      const updatedMe = await actions.fetchProfileData(me.id, me.id);
      if (updatedMe) {
        const nextLevel = updatedMe.level ?? 1;
        const currentLevel = me.level ?? 1;
        
        let hasUnlockedNewBadge = false;
        let newBadgeTitle: string | null = null;
        if (updatedMe.badgeTitle !== me.badgeTitle && updatedMe.badgeTitle !== null) {
          hasUnlockedNewBadge = true;
          newBadgeTitle = updatedMe.badgeTitle ?? null;
        }

        if (nextLevel > currentLevel || hasUnlockedNewBadge) {
          setLevelUpData({ level: nextLevel, badge: newBadgeTitle });
          setIsLevelUpModalOpen(true);

          addNotification(
            me.id,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_TITLE,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_BODY(nextLevel),
            'LEVEL_UP',
            '/chibi linh vật/chúc mừng.png'
          );
        }

        // Calculate point and XP changes
        let diffPoints = 0;
        let diffXp = 0;

        if (me.points !== undefined && me.points !== null) {
          diffPoints = (updatedMe.points ?? 0) - me.points;
        }
        if (me.xp !== undefined && me.xp !== null) {
          diffXp = (updatedMe.xp ?? 0) - me.xp;
        } else {
          // OCP: Lookup map fallback if xp is undefined on me
          const REASON_TO_XP: Record<string, number> = {
            [LABELS.LOYALTY.REASONS.LIKE_POST]:      LIMITS.LOYALTY_POINTS.LIKE_POST,
            [LABELS.LOYALTY.REASONS.UNLIKE_POST]:    LIMITS.LOYALTY_POINTS.UNLIKE_POST,
            [LABELS.LOYALTY.REASONS.COMMENT_POST]:   LIMITS.LOYALTY_POINTS.COMMENT_POST,
            [LABELS.LOYALTY.REASONS.DELETE_COMMENT]: LIMITS.LOYALTY_POINTS.DELETE_COMMENT,
            [LABELS.LOYALTY.REASONS.REPLY_COMMENT]:  LIMITS.LOYALTY_POINTS.REPLY_COMMENT,
            [LABELS.LOYALTY.REASONS.DELETE_REPLY]:   LIMITS.LOYALTY_POINTS.DELETE_REPLY,
            [LABELS.LOYALTY.REASONS.CREATE_POST]:    LIMITS.LOYALTY_POINTS.CREATE_POST,
            [LABELS.LOYALTY.REASONS.DELETE_POST]:    LIMITS.LOYALTY_POINTS.DELETE_POST,
            [LABELS.LOYALTY.REASONS.SHARE_POST]:     LIMITS.LOYALTY_POINTS.SHARE_POST,
          };
          diffXp = REASON_TO_XP[reason] ?? 0;
        }

        // 2. If the active profile on the page is me, update the page's profile state
        if (profile && profile.id === me.id) {
          actions.setProfile(updatedMe);
        } else if (profile) {
          // If we are viewing someone else's profile, we should fetch their updated profile to refresh their counts (e.g. followers or likes count)
          const updatedProfile = await actions.fetchProfileData(profile.id, me.id);
          if (updatedProfile) {
            actions.setProfile(updatedProfile);
          }
        }

        // 3. Update the logged-in user session state
        login({
          ...me,
          points: updatedMe.points,
          xp: updatedMe.xp,
          level: updatedMe.level,
          badgeTitle: updatedMe.badgeTitle,
        });

        // 4. Show point and XP change notifications
        if (diffPoints > 0) {
          toast.success(LABELS.LOYALTY.AWARD_POINTS_SUCCESS(diffPoints, reason));
        } else if (diffPoints < 0) {
          toast.info(LABELS.LOYALTY.DEDUCT_POINTS_SUCCESS(Math.abs(diffPoints), reason));
        }

        if (diffXp > 0) {
          toast.success(LABELS.LOYALTY.AWARD_XP_SUCCESS(diffXp, reason));
        } else if (diffXp < 0) {
          toast.info(LABELS.LOYALTY.DEDUCT_XP_SUCCESS(Math.abs(diffXp), reason));
        }
      }
    } catch (err) {
      console.error('Lỗi khi làm mới profile:', err);
    }
  };

  const getFetchId = () => {
    if (!isProfilePage) return undefined;
    return targetId ? parseInt(targetId) : me?.id;
  };

  const handleCreatePost = async (newPost?: unknown) => {
    toast.success(LABELS.SOCIAL.POST_SUCCESS);
    try {
      const authorId = getFetchId();
      // bypass cache với timestamp
      const data = await apiClient.get('/posts', { params: authorId ? { authorId, _t: Date.now() } : { _t: Date.now() } });
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    }
    awardPoints(LABELS.LOYALTY.REASONS.CREATE_POST);
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      await socialService.toggleLike(postId);
      if (isLiked) {
        awardPoints(LABELS.LOYALTY.REASONS.LIKE_POST);
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
        awardPoints(LABELS.LOYALTY.REASONS.UNLIKE_POST);
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

      awardPoints(LABELS.LOYALTY.REASONS.COMMENT_POST);
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

      // Bypass cache — thêm timestamp để server không trả data cũ từ Redis/in-memory cache
      const authorId = getFetchId();
      const data = await apiClient.get('/posts', {
        params: authorId
          ? { authorId, _t: Date.now() }
          : { _t: Date.now() },
      });
      setPosts(data || []);

      awardPoints(LABELS.LOYALTY.REASONS.SHARE_POST);

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
      awardPoints(LABELS.LOYALTY.REASONS.DELETE_COMMENT);
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
      awardPoints(LABELS.LOYALTY.REASONS.REPLY_COMMENT);

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
      awardPoints(LABELS.LOYALTY.REASONS.DELETE_REPLY);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.REPLY_DELETE_ERROR);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await socialService.deletePost(postId);
      // Xóa khỏi danh sách UI ngay lập tức
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      // Cập nhật _count.posts trên profile ngay (không chờ awardPoints refetch)
      if (profile) {
        actions.setProfile({
          ...profile,
          _count: {
            ...profile._count,
            posts: Math.max(0, (profile._count?.posts || 1) - 1),
          },
        });
      }
      toast.success(LABELS.SOCIAL.TOAST.POST_DELETE_SUCCESS);
      awardPoints(LABELS.LOYALTY.REASONS.DELETE_POST);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.POST_DELETE_ERROR);
    }
  };

  return {
    isReportModalOpen,
    setIsReportModalOpen,
    reportTargetId,
    setReportTargetId,
    reportTargetType,
    setReportTargetType,
    awardPoints,
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
  };
};
