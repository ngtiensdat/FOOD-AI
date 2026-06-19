'use client';

import React, { useState, useEffect } from 'react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { socialService } from '@/services/social.service';
import { User } from '@/types/user';
import { PostHeader } from './post-card/PostHeader';
import { PostContent } from './post-card/PostContent';
import { PostActions } from './post-card/PostActions';
import { CommentsSection } from './post-card/CommentsSection';

export interface ReplyData {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommentData {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  replies?: ReplyData[];
}

export interface PostData {
  id: number;
  title: string;
  content: string;
  postType: 'NORMAL' | 'REVIEW' | 'PROMOTION';
  rating?: number | null;
  image?: string | null;
  images?: string[];
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: CommentData[];
  author: {
    id?: number;
    name: string;
    avatar?: string;
    badgeTitle?: string | null;
    level?: number;
  };
  restaurant?: {
    id?: number;
    name: string;
  } | null;
  food?: {
    id?: number;
    name: string;
  } | null;
  isShared?: boolean;
  sharedFrom?: {
    id?: number;
    name: string;
    avatar?: string;
  } | null;
  likedByUsers?: { id: number; name: string }[];
  sharedByUsers?: { id: number; name: string }[];
  sharesCount?: number;
  isSaved?: boolean;
}

interface PostCardProps {
  post: PostData;
  me: Partial<User> | null;
  onLike: (postId: number, isLiked: boolean) => void;
  onComment: (postId: number, content: string) => void;
  onReport: (targetId: number, targetType: 'POST' | 'COMMENT') => void;
  onShare?: (post: PostData) => void;
  onDeleteComment?: (postId: number, commentId: number) => void;
  onReplyComment?: (postId: number, commentId: number, content: string) => void;
  onDeleteReply?: (postId: number, commentId: number, replyId: number) => void;
  onDeletePost?: (postId: number) => void;
}

export function PostCard({
  post,
  me,
  onLike,
  onComment,
  onReport,
  onShare,
  onDeleteComment,
  onReplyComment,
  onDeleteReply,
  onDeletePost,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<CommentData[]>(post.comments);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [localPost, setLocalPost] = useState(post);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setComments(post.comments);
    setIsSaved(post.isSaved || false);
    setLocalPost(post);
  }, [post.isLiked, post.likesCount, post.comments, post.isSaved]);

  const handlePostUpdated = (updated: Partial<PostData>) => {
    setLocalPost((prev) => ({ ...prev, ...updated }));
  };

  useEffect(() => {
    const handleHashCheck = () => {
      if (typeof window !== 'undefined' && window.location.hash === `#post-${post.id}`) {
        const element = document.getElementById(`post-${post.id}`);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
            }, 3000);
          }, 300);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [post.id]);

  const isOwner = me?.id === post.author?.id;

  const handleSavePost = async () => {
    if (!me) {
      toast.error(LABELS.AUTH.LOGIN_REQUIRED);
      return;
    }
    try {
      const res = await socialService.toggleSavePost(post.id);
      const nextSaved = res.isSaved;
      setIsSaved(nextSaved);
      if (nextSaved) {
        toast.success(LABELS.SOCIAL.TOAST.SAVE_SUCCESS);
      } else {
        toast.success(LABELS.SOCIAL.TOAST.UNSAVE_SUCCESS);
      }
    } catch (e) {
      console.error('Lỗi khi lưu bài viết:', e);
      toast.error(LABELS.SOCIAL.TOAST.SAVE_ERROR);
    }
  };

  const handleDeleteCommentClick = (commentId: number) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    if (onDeleteComment) {
      onDeleteComment(post.id, commentId);
    }
  };

  const handleReportPost = () => {
    onReport(post.id, 'POST');
  };

  const handleShareClick = () => {
    if (!me) {
      toast.error(LABELS.AUTH.LOGIN_REQUIRED);
      return;
    }
    if (onShare) {
      onShare(post);
    }
  };

  const handleLikeToggle = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    onLike(post.id, nextLiked);
  };

  const handleSendComment = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: CommentData = {
      id: Date.now(),
      userId: me?.id || 0,
      userName: me?.name || LABELS.SOCIAL.AUTHOR_FALLBACK,
      userAvatar: me?.avatar,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...comments, newComment];
    setComments(updated);
    onComment(post.id, newCommentText.trim());
    setNewCommentText('');
  }, [newCommentText, me, comments, post.id, onComment]);

  const handleSendReply = React.useCallback((e: React.FormEvent, commentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply: ReplyData = {
      id: Date.now(),
      userId: me?.id || 0,
      userName: me?.name || LABELS.SOCIAL.AUTHOR_FALLBACK,
      userAvatar: me?.avatar,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    });
    
    setComments(updated);
    if (onReplyComment) {
      onReplyComment(post.id, commentId, replyText.trim());
    }
    setReplyText('');
    setReplyingToCommentId(null);
  }, [replyText, me, comments, post.id, onReplyComment]);

  const handleDeleteReplyClick = (commentId: number, replyId: number) => {
    const updated = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: (c.replies || []).filter(r => r.id !== replyId)
        };
      }
      return c;
    });
    setComments(updated);
    if (onDeleteReply) {
      onDeleteReply(post.id, commentId, replyId);
    }
  };

  return (
    <article id={`post-${post.id}`} className="card-premium p-6 space-y-4 fade-in relative hover:z-[60] focus-within:z-[60]">
      <PostHeader
        post={localPost}
        me={me}
        isOwner={isOwner}
        isSaved={isSaved}
        handleSavePost={handleSavePost}
        handleReportPost={handleReportPost}
        onDeletePost={onDeletePost}
        onPostUpdated={handlePostUpdated}
      />

      <PostContent post={localPost} />

      <PostActions
        isLiked={isLiked}
        likesCount={likesCount}
        commentsCount={comments.length}
        showComments={showComments}
        handleLikeToggle={handleLikeToggle}
        setShowComments={setShowComments}
        handleShareClick={handleShareClick}
      />

      {showComments && (
        <CommentsSection
          postId={post.id}
          comments={comments}
          me={me}
          postAuthorId={post.author?.id}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          handleSendComment={handleSendComment}
          replyingToCommentId={replyingToCommentId}
          setReplyingToCommentId={setReplyingToCommentId}
          replyText={replyText}
          setReplyText={setReplyText}
          handleSendReply={handleSendReply}
          handleDeleteCommentClick={handleDeleteCommentClick}
          handleDeleteReplyClick={handleDeleteReplyClick}
          onReport={onReport}
        />
      )}
    </article>
  );
}
