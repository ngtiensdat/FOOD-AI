/**
 * Mục đích file này để làm gì: Thẻ bài đăng Mạng xã hội của người dùng (PostCard).
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị chi tiết bài đăng, điểm đánh giá, bình luận và nút tương tác (thích, bình luận, báo cáo vi phạm).
 * Các chức năng đặc biệt: Tăng giảm số lượt thích thực tế, thêm bình luận động trực quan, mở Modal báo cáo vi phạm, hiển thị badge phân loại bài đăng (NORMAL/REVIEW/PROMOTION).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, MessageSquare, AlertOctagon, Send, Star, MapPin, Utensils, 
  MoreHorizontal, Pin, Pencil, Users, BellOff, Tag, Languages, Calendar, 
  RefreshCw, Bookmark, Forward, Trash2 
} from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Avatar } from '@/components/base/Avatar';
import { LABELS } from '@/constants/labels';
import SafeImage from '@/components/base/SafeImage';
import { formatDateTime, formatTime } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';

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
}

interface PostCardProps {
  post: PostData;
  me: any;
  onLike: (postId: number, isLiked: boolean) => void;
  onComment: (postId: number, content: string) => void;
  onReport: (targetId: number, targetType: 'POST' | 'COMMENT') => void;
  onShare?: (post: PostData) => void;
  onDeleteComment?: (postId: number, commentId: number) => void;
  onReplyComment?: (postId: number, commentId: number, content: string) => void;
  onDeleteReply?: (postId: number, commentId: number, replyId: number) => void;
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
}: PostCardProps) {
  const router = useRouter();
  const showLevel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('privacy_showLevel') ?? 'true') : true;
  const showBadge = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('privacy_showBadge') ?? 'true') : true;
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<CommentData[]>(post.comments);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setComments(post.comments);
  }, [post.isLiked, post.likesCount, post.comments]);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedIds = localStorage.getItem('foodai_saved_post_ids');
      if (savedIds) {
        try {
          const parsed = JSON.parse(savedIds);
          return Array.isArray(parsed) && parsed.includes(post.id);
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  });

  const isOwner = me?.id === post.author?.id;

  const handleDropdownAction = (actionName: string) => {
    setShowDropdown(false);
    toast.success(LABELS.SOCIAL.TOAST.ACTION_DONE(actionName));
  };

  const handleSavePost = () => {
    const savedIdsStr = localStorage.getItem('foodai_saved_post_ids') || '[]';
    let savedIds: number[] = [];
    try {
      savedIds = JSON.parse(savedIdsStr);
    } catch (e) {}

    const nextSaved = !isSaved;
    if (nextSaved) {
      if (!savedIds.includes(post.id)) {
        savedIds.push(post.id);
      }
      toast.success(LABELS.SOCIAL.TOAST.SAVE_SUCCESS);
    } else {
      savedIds = savedIds.filter(id => id !== post.id);
      toast.success(LABELS.SOCIAL.TOAST.UNSAVE_SUCCESS);
    }
    localStorage.setItem('foodai_saved_post_ids', JSON.stringify(savedIds));
    setIsSaved(nextSaved);
    setShowDropdown(false);
  };

  const handleDeleteCommentClick = (commentId: number) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    if (onDeleteComment) {
      onDeleteComment(post.id, commentId);
    }
  };

  const handleReportPost = () => {
    setShowDropdown(false);
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
      userAvatar: me?.profile?.avatar,
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
      userAvatar: me?.profile?.avatar,
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

  // Helper to determine type badge style
  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'REVIEW':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'PROMOTION':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-slate-700';
    }
  };

  const formattedDate = formatDateTime(post.createdAt);
  const formatCommentDate = (dateStr: string) => formatTime(dateStr);

  return (
    <article className="card-premium p-6 space-y-4 fade-in">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => {
              if (post.author.id) {
                router.push(`/profile?id=${post.author.id}`);
              }
            }}
            className={`flex items-center gap-3 ${post.author.id ? 'cursor-pointer group/author' : ''}`}
          >
            <div className={post.author.id ? 'group-hover/author:scale-105 transition-transform duration-200' : ''}>
              <Avatar src={post.author.avatar} name={post.author.name} size={40} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-extrabold text-gray-900 dark:text-white text-sm ${post.author.id ? 'group-hover/author:text-primary transition-colors' : ''}`}>
                  {post.author.name}
                </span>
                {post.isShared ? (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {LABELS.SOCIAL.SHARED_BADGE}
                  </span>
                ) : (
                  <>
                    {showLevel && post.author.level && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded">
                        Lv.{post.author.level}
                      </span>
                    )}
                    {showBadge && post.author.badgeTitle && (
                      <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                        {post.author.badgeTitle}
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-mini text-gray-400 font-bold mt-0.5">{formattedDate}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Post Type Badge */}
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${getPostTypeBadge(post.postType)}`}>
            {post.postType === 'REVIEW' && LABELS.SOCIAL.POST_TYPE_REVIEW}
            {post.postType === 'PROMOTION' && LABELS.SOCIAL.POST_TYPE_PROMOTION}
            {post.postType === 'NORMAL' && LABELS.SOCIAL.POST_TYPE_NORMAL}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Tùy chọn bài viết"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 py-2 space-y-0.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                  {isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.PIN)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Pin size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.PIN}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.EDIT)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Pencil size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.EDIT}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.EDIT_AUDIENCE)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Users size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.EDIT_AUDIENCE}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.MUTE)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <BellOff size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.MUTE}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.SHARE_PROMO)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Tag size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.SHARE_PROMO}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.UNTRANSLATE)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Languages size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.UNTRANSLATE}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.EDIT_DATE)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Calendar size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.EDIT_DATE}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownAction(LABELS.SOCIAL.DROPDOWN.REFRESH_ATTACHMENT)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <RefreshCw size={14} className="text-gray-400" />
                        <span>{LABELS.SOCIAL.DROPDOWN.REFRESH_ATTACHMENT}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSavePost}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                      >
                        <Bookmark size={14} className={`text-gray-400 ${isSaved ? 'fill-gray-400' : ''}`} />
                        <span>{isSaved ? LABELS.SOCIAL.DROPDOWN.UNSAVE : LABELS.SOCIAL.DROPDOWN.SAVE}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReportPost}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-left"
                      >
                        <AlertOctagon size={14} className="text-rose-500" />
                        <span>{LABELS.SOCIAL.DROPDOWN.REPORT}</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Linked Info Row & Content & Image */}
      {post.isShared ? (
        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-900/30 space-y-4">
          {/* Original Author Header */}
          <div className="flex items-center gap-2">
            <div 
              onClick={() => {
                if (post.sharedFrom?.id) {
                  router.push(`/profile?id=${post.sharedFrom.id}`);
                }
              }}
              className={`flex items-center gap-2 ${post.sharedFrom?.id ? 'cursor-pointer group/orig-author' : ''}`}
            >
              <Avatar src={post.sharedFrom?.avatar} name={post.sharedFrom?.name || ''} size={28} />
              <div>
                <span className="font-extrabold text-gray-800 dark:text-slate-200 text-xs hover:text-primary transition-colors block">
                  {post.sharedFrom?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Original Linked Info Row */}
          {(post.restaurant || post.food || post.rating) && (
            <div className="flex flex-wrap items-center gap-3 py-1.5 border-y border-gray-100/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-500">
              {post.rating && (
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-md">
                  <Star size={12} className="fill-yellow-500 text-yellow-500" />
                  <span>{post.rating} / 5</span>
                </div>
              )}
              {post.restaurant && (
                <div className="flex items-center gap-1.5 text-primary">
                  <MapPin size={12} />
                  <span>{post.restaurant.name}</span>
                </div>
              )}
              {post.food && (
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Utensils size={12} />
                  <span>{post.food.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Original Title & Body */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{post.title}</h4>
            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Original Post Image */}
          {post.image && (
            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <SafeImage
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Linked Info Row */}
          {(post.restaurant || post.food || post.rating) && (
            <div className="flex flex-wrap items-center gap-3 py-2 border-y border-gray-50 dark:border-slate-800 text-xs font-bold text-gray-500">
              {post.rating && (
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-md">
                  <Star size={14} className="fill-yellow-500 text-yellow-500" />
                  <span>{post.rating} / 5</span>
                </div>
              )}
              {post.restaurant && (
                <div className="flex items-center gap-1.5 text-primary">
                  <MapPin size={14} />
                  <span>{post.restaurant.name}</span>
                </div>
              )}
              {post.food && (
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Utensils size={14} />
                  <span>{post.food.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Title & Body */}
          <div className="space-y-2">
            <h4 className="text-body font-black text-gray-900 leading-tight">{post.title}</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <SafeImage
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}
        </>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isLiked
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500'
              }`}
            aria-label={isLiked ? LABELS.SOCIAL.UNLIKE : LABELS.SOCIAL.LIKE}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110' : ''} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 ${
              showComments ? 'bg-gray-100 dark:bg-slate-800 text-primary' : ''
            }`}
            aria-label={LABELS.SOCIAL.TOGGLE_COMMENTS}
          >
            <MessageSquare size={16} />
            <span>{comments.length}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500"
            aria-label={LABELS.SOCIAL.SHARE}
          >
            <Forward size={16} />
            <span>{LABELS.SOCIAL.SHARE}</span>
          </button>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="space-y-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-800 fade-in">
          <h5 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
            {LABELS.SOCIAL.COMMENTS_TITLE} ({comments.length})
          </h5>

          {/* Existing Comments list */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">{LABELS.SOCIAL.NO_COMMENTS}</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs relative group">
                  <Avatar src={comment.userAvatar} name={comment.userName} size={28} className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-900">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    
                    {/* Reply Action */}
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id);
                          setReplyText('');
                        }}
                        className="hover:text-primary transition-colors"
                      >
                        {LABELS.SOCIAL.REPLY}
                      </button>
                    </div>

                    {/* Inline Reply Form */}
                    {replyingToCommentId === comment.id && (
                      <form onSubmit={(e) => handleSendReply(e, comment.id)} className="flex gap-2 mt-2 pt-1.5 border-t border-dashed border-gray-100 dark:border-slate-800">
                        <input
                          type="text"
                          className="form-input !py-1.5 !text-[11px] !px-3"
                          placeholder={LABELS.SOCIAL.REPLY_PLACEHOLDER(comment.userName)}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white rounded-xl text-[11px] font-bold transition-all"
                        >
                          {LABELS.SOCIAL.SEND}
                        </button>
                      </form>
                    )}

                    {/* Nested Replies List */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-gray-100/50 dark:border-slate-800/50">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2 items-start pl-4 border-l border-gray-200 dark:border-slate-700 relative group/reply py-1">
                            <Avatar src={reply.userAvatar} name={reply.userName} size={20} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-[11px] text-gray-800 dark:text-slate-200">{reply.userName}</span>
                                <span className="text-[9px] text-gray-400 font-bold">
                                  {formatCommentDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed">{reply.content}</p>
                            </div>
                            
                            {/* Delete Reply Button */}
                            {(reply.userId === me?.id || post.author?.id === me?.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReplyClick(comment.id, reply.id)}
                                className="absolute right-0 top-1 p-0.5 text-gray-300 hover:text-rose-500 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                title={LABELS.SOCIAL.DELETE_REPLY}
                                aria-label={LABELS.SOCIAL.DELETE_REPLY}
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete or Report Comment Button */}
                  {(comment.userId === me?.id || post.author?.id === me?.id) ? (
                    <button
                      onClick={() => handleDeleteCommentClick(comment.id)}
                      className="absolute right-2 bottom-2 p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={LABELS.SOCIAL.DELETE_COMMENT}
                      title={LABELS.SOCIAL.DELETE_COMMENT}
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReport(comment.id, 'COMMENT')}
                      className="absolute right-2 bottom-2 p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={LABELS.SOCIAL.REPORT_COMMENT}
                      title={LABELS.SOCIAL.REPORT_COMMENT}
                    >
                      <AlertOctagon size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Write Comment Form */}
          <form onSubmit={handleSendComment} className="flex gap-2 mt-2">
            <input
              type="text"
              className="form-input !py-2.5"
              placeholder={LABELS.SOCIAL.COMMENT_PLACEHOLDER}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
            />
            <Button variant="primary" type="submit" className="px-4 py-2.5 shadow-md">
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </article>
  );
};
