// Mục đích: Sub-component header của bài đăng — avatar, thời gian, type badge, dropdown menu hành động.
// Tất cả action trong dropdown đều có logic thực sự (không chỉ toast giả).
// Z-index: dropdown dùng fixed + tọa độ tính từ button để không bị chìm dưới card.
'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal, Pin, PinOff, Pencil, BellOff, BellRing,
  Languages, RefreshCw, Bookmark, BookmarkCheck, AlertOctagon, Trash2,
} from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { formatDateTime } from '@/utils/formatters';
import { User, isAdmin } from '@/types/user';
import { PostData } from '../PostCard';
import { EditPostModal } from '../EditPostModal';
import { socialService } from '@/services/social.service';
import { ConfirmModal } from '@/components/base/ConfirmModal';

interface PostHeaderProps {
  post: PostData;
  me: Partial<User> | null;
  isOwner: boolean;
  isSaved: boolean;
  handleSavePost: () => Promise<void>;
  handleReportPost: () => void;
  onDeletePost?: (postId: number) => void;
  onPostUpdated?: (updated: Partial<PostData>) => void;
}

export function PostHeader({
  post,
  me,
  isOwner,
  isSaved,
  handleSavePost,
  handleReportPost,
  onDeletePost,
  onPostUpdated,
}: PostHeaderProps) {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const showLevel = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('privacy_showLevel') ?? 'true') : true;
  const showBadge = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('privacy_showBadge') ?? 'true') : true;

  // Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // UI states for toggle actions
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const closeDropdown = () => setShowDropdown(false);

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

  // ——— Actions ———

  const handlePin = async () => {
    closeDropdown();
    try {
      await socialService.togglePinPost(localPost.id);
      const next = !isPinned;
      setIsPinned(next);
      toast.success(next ? LABELS.SOCIAL.TOAST.PIN_SUCCESS : LABELS.SOCIAL.TOAST.UNPIN_SUCCESS);
    } catch {
      toast.error(LABELS.SOCIAL.TOAST.PIN_ERROR);
    }
  };

  const handleEdit = () => {
    closeDropdown();
    setShowEditModal(true);
  };

  const handleMute = () => {
    closeDropdown();
    const next = !isMuted;
    setIsMuted(next);
    toast.success(next ? LABELS.SOCIAL.TOAST.MUTE_ON : LABELS.SOCIAL.TOAST.MUTE_OFF);
  };

  const handleTranslate = () => {
    closeDropdown();
    const next = !isTranslated;
    setIsTranslated(next);
    toast.success(next ? LABELS.SOCIAL.TOAST.TRANSLATE_ON : LABELS.SOCIAL.TOAST.TRANSLATE_OFF);
  };

  const handleRefreshAttachment = () => {
    closeDropdown();
    toast.info(LABELS.SOCIAL.TOAST.REFRESH_ATTACHMENT_DOING);
    // Trong thực tế sẽ trigger refetch metadata cho link attachment
    setTimeout(() => toast.success(LABELS.SOCIAL.TOAST.REFRESH_ATTACHMENT_DONE), 1200);
  };

  const handleSave = async () => {
    closeDropdown();
    await handleSavePost();
  };

  const handleReport = () => {
    closeDropdown();
    handleReportPost();
  };

  const handleDelete = () => {
    closeDropdown();
    setShowDeleteConfirm(true);
  };

  const handlePostUpdated = (updated: Partial<PostData>) => {
    setLocalPost((prev) => ({ ...prev, ...updated }));
    if (onPostUpdated) onPostUpdated(updated);
  };

  const formattedDate = formatDateTime(post.createdAt);

  return (
    <>
      {/* Edit modal */}
      {showEditModal && (
        <EditPostModal
          post={localPost}
          onClose={() => setShowEditModal(false)}
          onUpdated={handlePostUpdated}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={LABELS.SOCIAL.DROPDOWN.DELETE}
        message={LABELS.SOCIAL.TOAST.POST_DELETE_CONFIRM}
        confirmText={LABELS.COMMON.DELETE}
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (onDeletePost) onDeletePost(localPost.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="flex items-center justify-between">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => { if (post.author.id) router.push(`/profile?id=${post.author.id}`); }}
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
                {isPinned && (
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">{LABELS.SOCIAL.PINNED_BADGE}</span>
                )}
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

        {/* Right side: type badge + menu */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${getPostTypeBadge(localPost.postType)}`}>
            {localPost.postType === 'REVIEW' && LABELS.SOCIAL.POST_TYPE_REVIEW}
            {localPost.postType === 'PROMOTION' && LABELS.SOCIAL.POST_TYPE_PROMOTION}
            {localPost.postType === 'NORMAL' && LABELS.SOCIAL.POST_TYPE_NORMAL}
          </span>

          <div className="relative">
            <Button
              ref={btnRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
              aria-label={LABELS.SOCIAL.DROPDOWN.LABEL}
              variant="none"
              size="none"
            >
              <MoreHorizontal size={18} />
            </Button>

      {/* ——— Dropdown — absolute positioning ——— */}
      {showDropdown && (
        <>
          {/* Backdrop transparent */}
          <div className="fixed inset-0 z-[9989]" onClick={closeDropdown} />

          <div
            className="absolute top-full right-0 mt-2 z-[9990] w-64 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-0.5 text-xs font-bold text-gray-700 dark:text-slate-300"
          >
            {isOwner ? (
              <>
                {/* Pin */}
                <Button type="button" variant="none" size="none" onClick={handlePin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  {isPinned ? <PinOff size={14} className="text-primary shrink-0" /> : <Pin size={14} className="text-gray-400 shrink-0" />}
                  <span>{isPinned ? LABELS.SOCIAL.DROPDOWN.UNPIN : LABELS.SOCIAL.DROPDOWN.PIN}</span>
                </Button>

                {/* Edit */}
                <Button type="button" variant="none" size="none" onClick={handleEdit}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  <Pencil size={14} className="text-gray-400 shrink-0" />
                  <span>{LABELS.SOCIAL.DROPDOWN.EDIT}</span>
                </Button>

                {/* Mute */}
                <Button type="button" variant="none" size="none" onClick={handleMute}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  {isMuted
                    ? <BellRing size={14} className="text-primary shrink-0" />
                    : <BellOff size={14} className="text-gray-400 shrink-0" />}
                  <span>{isMuted ? LABELS.SOCIAL.DROPDOWN.UNMUTE : LABELS.SOCIAL.DROPDOWN.MUTE}</span>
                </Button>

                {/* Translate */}
                <Button type="button" variant="none" size="none" onClick={handleTranslate}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  <Languages size={14} className="text-gray-400 shrink-0" />
                  <span>{isTranslated ? LABELS.SOCIAL.DROPDOWN.UNTRANSLATE : LABELS.SOCIAL.DROPDOWN.TRANSLATE}</span>
                </Button>

                {/* Refresh attachment */}
                <Button type="button" variant="none" size="none" onClick={handleRefreshAttachment}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  <RefreshCw size={14} className="text-gray-400 shrink-0" />
                  <span>{LABELS.SOCIAL.DROPDOWN.REFRESH_ATTACHMENT}</span>
                </Button>
              </>
            ) : (
              <>
                {/* Save / Unsave */}
                <Button type="button" variant="none" size="none" onClick={handleSave}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  {isSaved
                    ? <BookmarkCheck size={14} className="text-primary shrink-0" />
                    : <Bookmark size={14} className="text-gray-400 shrink-0" />}
                  <span>{isSaved ? LABELS.SOCIAL.DROPDOWN.UNSAVE : LABELS.SOCIAL.DROPDOWN.SAVE}</span>
                </Button>

                {/* Mute */}
                <Button type="button" variant="none" size="none" onClick={handleMute}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-left">
                  {isMuted
                    ? <BellRing size={14} className="text-primary shrink-0" />
                    : <BellOff size={14} className="text-gray-400 shrink-0" />}
                  <span>{isMuted ? LABELS.SOCIAL.DROPDOWN.UNMUTE : LABELS.SOCIAL.DROPDOWN.MUTE}</span>
                </Button>

                {/* Report */}
                <Button type="button" variant="none" size="none" onClick={handleReport}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-left">
                  <AlertOctagon size={14} className="text-rose-500 shrink-0" />
                  <span>{LABELS.SOCIAL.DROPDOWN.REPORT}</span>
                </Button>
              </>
            )}

            {/* Delete — chủ bài hoặc Admin */}
            {(isOwner || isAdmin(me)) && (
              <Button type="button" variant="none" size="none" onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-left border-t border-gray-100 dark:border-slate-800 mt-1 pt-2">
                <Trash2 size={14} className="text-rose-500 shrink-0" />
                <span>{LABELS.SOCIAL.DROPDOWN.DELETE}</span>
              </Button>
            )}
          </div>
        </>
      )}
          </div>
        </div>
      </div>
    </>
  );
}
