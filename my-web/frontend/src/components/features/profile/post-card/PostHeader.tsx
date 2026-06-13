// Mục đích: Sub-component hiển thị phần header của bài đăng (avatar tác giả, thời gian, loại bài, dropdown menu hành động).
// Ý nghĩa: Tách biệt UI header khỏi PostCard.tsx để tuân thủ SRP. Chứa logic phân quyền xoá bài cho isOwner và Admin.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pin, Pencil, Users, BellOff, Tag, Languages, Calendar, RefreshCw, Bookmark, AlertOctagon, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { formatDateTime } from '@/utils/formatters';
import { User, isAdmin } from '@/types/user';
import { PostData } from '../PostCard';

interface PostHeaderProps {
  post: PostData;
  me: Partial<User> | null;
  isOwner: boolean;
  isSaved: boolean;
  handleSavePost: () => Promise<void>;
  handleReportPost: () => void;
  onDeletePost?: (postId: number) => void;
}

export function PostHeader({
  post,
  me,
  isOwner,
  isSaved,
  handleSavePost,
  handleReportPost,
  onDeletePost,
}: PostHeaderProps) {
  const router = useRouter();
  const showLevel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('privacy_showLevel') ?? 'true') : true;
  const showBadge = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('privacy_showBadge') ?? 'true') : true;
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDropdownAction = (actionName: string) => {
    setShowDropdown(false);
    toast.success(LABELS.SOCIAL.TOAST.ACTION_DONE(actionName));
  };

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

  return (
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
            aria-label={LABELS.SOCIAL.DROPDOWN.LABEL}
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
                      onClick={async () => {
                        setShowDropdown(false);
                        await handleSavePost();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left"
                    >
                      <Bookmark size={14} className={`text-gray-400 ${isSaved ? 'fill-gray-400' : ''}`} />
                      <span>{isSaved ? LABELS.SOCIAL.DROPDOWN.UNSAVE : LABELS.SOCIAL.DROPDOWN.SAVE}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        handleReportPost();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-left"
                    >
                      <AlertOctagon size={14} className="text-rose-500" />
                      <span>{LABELS.SOCIAL.DROPDOWN.REPORT}</span>
                    </button>
                  </>
                )}
                {(isOwner || isAdmin(me)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      if (onDeletePost) {
                        onDeletePost(post.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-left border-t border-gray-100 dark:border-slate-800 mt-1 pt-1.5"
                  >
                    <Trash2 size={14} className="text-rose-500" />
                    <span>{LABELS.SOCIAL.DROPDOWN.DELETE}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
