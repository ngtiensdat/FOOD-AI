// Mục đích: Sub-component hiển thị thanh hành động của bài viết (like, comment, share, save).
// Ý nghĩa: Tách biệt UI actions khỏi PostCard.tsx để tuân thủ SRP (SOLID).
'use client';

import React from 'react';
import { Heart, MessageSquare, Forward } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  showComments: boolean;
  handleLikeToggle: () => void;
  setShowComments: (show: boolean) => void;
  handleShareClick: () => void;
}

export function PostActions({
  isLiked,
  likesCount,
  commentsCount,
  showComments,
  handleLikeToggle,
  setShowComments,
  handleShareClick,
}: PostActionsProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <Button
          onClick={handleLikeToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isLiked
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500'
            }`}
          aria-label={isLiked ? LABELS.SOCIAL.UNLIKE : LABELS.SOCIAL.LIKE}
          variant="none"
          size="none"
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110' : ''} />
          <span>{likesCount}</span>
        </Button>

        {/* Comment Toggle Button */}
        <Button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 ${
            showComments ? 'bg-gray-100 dark:bg-slate-800 text-primary' : ''
          }`}
          aria-label={LABELS.SOCIAL.TOGGLE_COMMENTS}
          variant="none"
          size="none"
        >
          <MessageSquare size={16} />
          <span>{commentsCount}</span>
        </Button>

        {/* Share Button */}
        <Button
          onClick={handleShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500"
          aria-label={LABELS.SOCIAL.SHARE}
          variant="none"
          size="none"
        >
          <Forward size={16} />
          <span>{LABELS.SOCIAL.SHARE}</span>
        </Button>
      </div>
    </div>
  );
}
