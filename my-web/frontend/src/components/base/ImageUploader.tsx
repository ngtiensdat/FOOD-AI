/**
 * @fileoverview frontend/src/components/base/ImageUploader.tsx
 * @description Component cho phép người dùng chọn ảnh từ máy, crop/preview,
 * rồi upload lên Cloudinary. Hỗ trợ drag & drop và click to browse.
 */
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, Crop } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { mediaService } from '@/services/media.service';
import { toast } from '@/store/useToastStore';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { ImageCropModal } from '@/components/base/ImageCropModal';
import { extractPublicId } from '@/utils/helpers';
import { LABELS } from '@/constants/labels';

export type UploadType = 'avatar' | 'cover' | 'post-image';

interface ImageUploaderProps {
  /** URL ảnh hiện tại (có thể là URL Cloudinary cũ hoặc URL bên ngoài) */
  currentUrl?: string;
  /** Label hiển thị phía trên */
  label?: string;
  /** Kiểu upload (xác định endpoint và transform) */
  uploadType?: UploadType;
  /** Callback khi URL ảnh mới được upload thành công */
  onUploaded: (url: string) => void;
  /** Aspect ratio của preview */
  aspectRatio?: 'square' | 'cover';
}

/** Tỉ lệ khung hình crop theo loại ảnh */
const ASPECT_MAP: Record<UploadType, number | undefined> = {
  avatar: 1,          // Vuông 1:1
  cover: 3,           // Ngang 3:1 (hợp với chiều cao h-96 của container Profile)
  'post-image': undefined, // Tự do
};

/** Tên hiển thị theo loại ảnh */
const LABEL_MAP: Record<UploadType, string> = {
  avatar: 'Ảnh đại diện',
  cover: 'Ảnh bìa',
  'post-image': 'Ảnh bài đăng',
};



export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl,
  label,
  uploadType = 'avatar',
  onUploaded,
  aspectRatio = 'square',
}) => {
  const labels = LABELS;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Khi người dùng chọn file → mở crop modal
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(labels.UPLOADER.ACCEPT_FORMAT);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(labels.UPLOADER.MAX_SIZE);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setCropSrc(objectUrl);
  }, []);

  // Sau khi crop xác nhận → upload blob đã crop
  const handleCropConfirm = useCallback(async (croppedBlob: Blob) => {
    setCropSrc(null);
    if (pendingFile) URL.revokeObjectURL(URL.createObjectURL(pendingFile));
    setPendingFile(null);

    // Tạo preview local
    const localPreview = URL.createObjectURL(croppedBlob);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    // Chuyển blob thành File để upload
    const croppedFile = new File(
      [croppedBlob],
      `${uploadType}-${Date.now()}.jpg`,
      { type: 'image/jpeg' },
    );

    try {
      let url: string;
      if (uploadType === 'avatar') {
        url = await mediaService.uploadAvatar(croppedFile);
      } else if (uploadType === 'cover') {
        url = await mediaService.uploadCover(croppedFile);
      } else {
        url = await mediaService.uploadPostImage(croppedFile);
      }
      onUploaded(url);
      toast.success(labels.UPLOADER.UPLOAD_SUCCESS);
    } catch {
      toast.error(labels.UPLOADER.UPLOAD_FAIL);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [uploadType, onUploaded, pendingFile, labels.UPLOADER]);

  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [cropSrc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = previewUrl || currentUrl;
    const publicId = extractPublicId(targetUrl || '');

    if (publicId) {
      setIsDeleting(true);
      try {
        await mediaService.deleteImage(publicId);
        toast.success(labels.UPLOADER.DELETE_SUCCESS);
      } catch {
        toast.error(labels.UPLOADER.DELETE_FAIL);
        setIsDeleting(false);
        return;
      }
    }

    setPreviewUrl(null);
    onUploaded('');
    setIsDeleting(false);
  }, [previewUrl, currentUrl, onUploaded, labels.UPLOADER]);

  const displayUrl = previewUrl || currentUrl;
  const busy = isUploading || isDeleting;

  return (
    <>
      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={ASPECT_MAP[uploadType]}
          cropLabel={LABEL_MAP[uploadType]}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
            {label}
          </label>
        )}

        <div
          className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
            ${isDragging
              ? 'border-primary bg-orange-50 dark:bg-orange-950/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }
            ${aspectRatio === 'square' ? 'w-full aspect-square max-w-[120px]' : 'w-full h-[120px]'}
          `}
          onClick={() => {
            if (!busy) inputRef.current?.click();
          }}
          onDragOver={(e) => { e.preventDefault(); if (!busy) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { if (!busy) handleDrop(e); }}
        >
          {displayUrl ? (
            <>
              <SafeImage src={displayUrl} alt="Preview" fill className="object-cover" />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  ) : isDeleting ? (
                    <Loader2 size={20} className="animate-spin mx-auto text-red-400" />
                  ) : (
                    <>
                      <Upload size={18} className="mx-auto mb-1" />
                      <span className="text-[10px] font-bold">{labels.UPLOADER.CHANGE_IMAGE}</span>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
              {isUploading ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : (
                <>
                  <ImageIcon size={22} />
                  <span className="text-[10px] font-medium text-center px-2">
                    {isDragging ? labels.UPLOADER.DROP_HERE : labels.UPLOADER.CLICK_OR_DRAG}
                  </span>
                </>
              )}
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {displayUrl && !isUploading && (
          <div className="flex items-center gap-2">
            {/* Crop button */}
            <Button
              type="button"
              variant="none"
              size="none"
              onClick={(e) => {
                e.stopPropagation();
                // Mở crop lại với ảnh hiện tại
                setCropSrc(displayUrl);
              }}
              disabled={busy}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-primary transition-colors bg-gray-100 hover:bg-orange-50 px-2 py-1 rounded"
            >
              <Crop size={12} />
              {labels.UPLOADER.CUSTOMIZE_FRAME}
            </Button>

            {/* Delete button */}
            <Button
              type="button"
              variant="none"
              size="none"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 px-2 py-1 rounded"
            >
              {isDeleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              {isDeleting ? labels.UPLOADER.DELETING : labels.UPLOADER.DELETE_IMAGE}
            </Button>
          </div>
        )}

        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />
      </div>
    </>
  );
};
