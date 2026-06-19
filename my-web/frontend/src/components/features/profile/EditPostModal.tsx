/**
 * @fileoverview frontend/src/components/features/profile/EditPostModal.tsx
 * @description Modal chỉnh sửa bài đăng đã có. Cho phép thay đổi tiêu đề, nội dung, ảnh và loại bài.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { PostImageUploader } from '@/components/base/PostImageUploader';
import { LABELS } from '@/constants/labels';
import { socialService } from '@/services/social.service';
import { toast } from '@/store/useToastStore';
import { PostData } from './PostCard';

interface EditPostModalProps {
  post: PostData;
  onClose: () => void;
  /** Callback khi lưu thành công — trả về bài đăng đã cập nhật */
  onUpdated: (updated: Partial<PostData>) => void;
}

export function EditPostModal({ post, onClose, onUpdated }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [images, setImages] = useState<string[]>(post.images || (post.image ? [post.image] : []));
  const [postType, setPostType] = useState<PostData['postType']>(post.postType);
  const [loading, setLoading] = useState(false);

  // Đóng khi bấm Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(LABELS.SOCIAL.TOAST.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(LABELS.SOCIAL.TOAST.CONTENT_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      await socialService.updatePost(post.id, {
        title: title.trim(),
        content: content.trim(),
        images,
        postType,
      });
      onUpdated({ title: title.trim(), content: content.trim(), images, postType });
      toast.success(LABELS.SOCIAL.TOAST.UPDATE_SUCCESS);
      onClose();
    } catch {
      toast.error(LABELS.SOCIAL.TOAST.UPDATE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h2 className="font-black text-gray-900 dark:text-white text-base">{LABELS.SOCIAL.EDIT_POST_TITLE}</h2>
          <Button type="button" variant="none" size="none" onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Post type */}
          <div className="flex gap-2 flex-wrap">
            {(['NORMAL', 'REVIEW', 'PROMOTION'] as const).map((t) => (
              <Button
                variant="none" size="none"
                key={t}
                type="button"
                onClick={() => setPostType(t)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  postType === t
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-primary hover:text-primary'
                }`}
              >
                {t === 'NORMAL' && LABELS.SOCIAL.POST_TYPE_NORMAL}
                {t === 'REVIEW' && LABELS.SOCIAL.POST_TYPE_REVIEW}
                {t === 'PROMOTION' && LABELS.SOCIAL.POST_TYPE_PROMOTION}
              </Button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {LABELS.SOCIAL.TITLE_LABEL}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={LABELS.SOCIAL.TITLE_PLACEHOLDER}
              maxLength={200}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {LABELS.SOCIAL.CONTENT_LABEL}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={LABELS.SOCIAL.CONTENT_PLACEHOLDER}
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-right text-xs text-gray-400">{content.length}/2000</p>
          </div>

          {/* Images */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {LABELS.COMMON.IMAGE}
            </label>
            <PostImageUploader images={images} onChange={setImages} disabled={loading} />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {LABELS.COMMON.CANCEL}
          </Button>
          <Button type="submit" variant="primary" loading={loading} onClick={handleSubmit}>
            <Save size={15} className="mr-1.5" />
            {LABELS.COMMON.SAVE}
          </Button>
        </div>
      </div>
    </div>
  );
}
