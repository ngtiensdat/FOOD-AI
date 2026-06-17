// Mục đích: Định nghĩa React Custom Hook useSocialActions dùng chung cho Forum và Profile.
// Ý nghĩa: Loại bỏ trùng lặp code (DRY Violation), đóng gói toàn bộ logic tương tác mạng xã hội.
// Các chức năng đặc biệt: Tích lũy điểm thưởng (awardPoints) khi tương tác, gửi thông báo real-time qua WebSocket.

import { useState } from 'react';
import { socialService } from '@/services/social.service';
import { addNotification } from '@/utils/notifications';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { PostData } from '@/components/features/profile/PostCard';
import { User, UserRole } from '@/types/user';

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

  // Gamification helper to award points and handle level-ups
  const awardPoints = async (pointsAmount: number, reason: string) => {
    if (!profile) return;
    if (profile.role !== UserRole.CUSTOMER && profile.role !== UserRole.RESTAURANT) return;

    try {
      const updatedProfile = await actions.fetchProfileData(profile.id, me?.id);
      if (updatedProfile) {
        const nextLevel = updatedProfile.level ?? 1;
        const currentLevel = profile.level ?? 1;
        if (nextLevel > currentLevel) {
          toast.success(LABELS.LOYALTY.LEVEL_UP_SUCCESS(nextLevel));
          addNotification(
            profile.id,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_TITLE,
            LABELS.LOYALTY.NOTIFICATIONS.LEVEL_UP_BODY(nextLevel),
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

  const getFetchId = () => {
    if (!isProfilePage) return undefined;
    return targetId ? parseInt(targetId) : me?.id;
  };

  const handleCreatePost = async (newPost?: unknown) => {
    toast.success(LABELS.SOCIAL.POST_SUCCESS);
    try {
      const authorId = getFetchId();
      const data = await socialService.getPosts(authorId);
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
      
      const authorId = getFetchId();
      const data = await socialService.getPosts(authorId);
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

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm(LABELS.SOCIAL.TOAST.POST_DELETE_CONFIRM)) return;
    try {
      await socialService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      toast.success(LABELS.SOCIAL.TOAST.POST_DELETE_SUCCESS);
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
  };
};
