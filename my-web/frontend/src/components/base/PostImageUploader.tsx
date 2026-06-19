/**
 * @fileoverview frontend/src/components/base/PostImageUploader.tsx
 * @description Component upload tối đa 5 ảnh cho bài đăng.
 * Khi người dùng chọn ảnh, sẽ hiện modal crop từng ảnh (tỉ lệ tự do) trước khi upload.
 * Hỗ trợ drag & drop, preview thumbnail, xóa từng ảnh.
 */
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, Plus, Crop } from 'lucide-react';
import SafeImage from './SafeImage';
import { mediaService } from '@/services/media.service';
import { toast } from '@/store/useToastStore';
import { ImageCropModal } from './ImageCropModal';
import { Button } from './Button';
import { Input } from './Input';
import { LABELS } from '@/constants/labels';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 8;

interface PostImageUploaderProps {
  /** Danh sách URL ảnh hiện tại */
  images: string[];
  /** Callback khi danh sách URL thay đổi */
  onChange: (urls: string[]) => void;
  /** Vô hiệu hóa khi form đang submit */
  disabled?: boolean;
}

export const PostImageUploader: React.FC<PostImageUploaderProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const labels = LABELS;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Crop modal state: xử lý từng ảnh trong hàng chờ
  const [cropQueue, setCropQueue] = useState<{ objectUrl: string; file: File }[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  // Mảng blob đã crop tích lũy — upload sau khi hết queue
  const pendingBlobsRef = React.useRef<Blob[]>([]);

  const canAddMore = images.length < MAX_IMAGES && !uploading && !isCropping && !disabled;

  // ——— Khi chọn file: validate rồi đẩy vào hàng chờ crop ———
  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((f) => {
        if (!f.type.startsWith('image/')) {
          toast.error(labels.UPLOADER.ACCEPT_FORMAT);
          return false;
        }
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(labels.UPLOADER.MAX_SIZE);
          return false;
        }
        return true;
      });

      const remaining = MAX_IMAGES - images.length;
      const toProcess = validFiles.slice(0, remaining);

      if (toProcess.length === 0) return;
      if (validFiles.length > remaining) {
        toast.info(labels.UPLOADER.MAX_IMAGES_REACHED(remaining, MAX_IMAGES));
      }

      // Tạo object URLs cho toàn bộ hàng chờ
      const queue = toProcess.map((file) => ({
        objectUrl: URL.createObjectURL(file),
        file,
      }));
      pendingBlobsRef.current = [];
      setCropQueue(queue);
      setIsCropping(true);
    },
    [images.length],
  );

  // ——— Xác nhận crop 1 ảnh → lưu blob, chuyển ảnh tiếp theo ———
  const handleCropConfirm = useCallback(
    async (blob: Blob) => {
      pendingBlobsRef.current.push(blob);

      // Giải phóng object URL đã dùng
      URL.revokeObjectURL(cropQueue[0]?.objectUrl || '');
      const remaining = cropQueue.slice(1);
      setCropQueue(remaining);

      if (remaining.length === 0) {
        // Hết hàng chờ → upload tất cả
        setIsCropping(false);
        setUploading(true);
        try {
          const files = pendingBlobsRef.current.map(
            (b, i) => new File([b], `post-image-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' }),
          );
          const urls = await mediaService.uploadPostImages(files);
          onChange([...images, ...urls]);
          toast.success(labels.UPLOADER.UPLOAD_SUCCESS);
        } catch {
          toast.error(labels.UPLOADER.UPLOAD_FAIL);
        } finally {
          pendingBlobsRef.current = [];
          setUploading(false);
          if (inputRef.current) inputRef.current.value = '';
        }
      }
    },
    [cropQueue, images, onChange],
  );

  // ——— Hủy crop 1 ảnh → dừng toàn bộ hàng chờ ———
  const handleCropCancel = useCallback(() => {
    cropQueue.forEach((q) => URL.revokeObjectURL(q.objectUrl));
    setCropQueue([]);
    pendingBlobsRef.current = [];
    setIsCropping(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [cropQueue]);

  // ——— Re-crop ảnh đã upload (mở lại modal với URL hiện tại) ———
  const [recropIndex, setRecropIndex] = useState<number | null>(null);
  const handleRecrop = useCallback((index: number) => {
    setRecropIndex(index);
  }, []);

  const handleRecropConfirm = useCallback(
    async (blob: Blob) => {
      if (recropIndex === null) return;
      setRecropIndex(null);
      setUploading(true);
      try {
        const file = new File([blob], `post-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const urls = await mediaService.uploadPostImages([file]);
        const next = [...images];
        next[recropIndex] = urls[0];
        onChange(next);
        toast.success(labels.UPLOADER.UPLOAD_SUCCESS);
      } catch {
        toast.error(labels.UPLOADER.UPLOAD_FAIL);
      } finally {
        setUploading(false);
      }
    },
    [recropIndex, images, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length) handleFiles(files);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!canAddMore) return;
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [canAddMore, handleFiles],
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Crop modal — ảnh mới (hàng chờ) */}
      {isCropping && cropQueue.length > 0 && (
        <ImageCropModal
          imageSrc={cropQueue[0].objectUrl}
          aspect={undefined}           // Tự do cho ảnh bài đăng
          // eslint-disable-next-line react-hooks/refs
          cropLabel={labels.UPLOADER.CROP_POST_IMAGE(pendingBlobsRef.current.length + 1, pendingBlobsRef.current.length + cropQueue.length)}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Crop modal — re-crop ảnh đã có */}
      {recropIndex !== null && images[recropIndex] && (
        <ImageCropModal
          imageSrc={images[recropIndex]}
          aspect={undefined}
          cropLabel={labels.UPLOADER.RECROP_IMAGE(recropIndex + 1)}
          onConfirm={handleRecropConfirm}
          onCancel={() => setRecropIndex(null)}
        />
      )}

      <div className="space-y-3">
        {/* Thumbnails + add zone */}
        <div className="flex flex-wrap gap-3 items-start">
          {/* Thumbnails */}
          {images.map((url, i) => (
            <div
              key={url + i}
              className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-slate-800 group shrink-0"
            >
              <SafeImage src={url} alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 1)} fill className="object-cover" sizes="80px" />

              {/* Hover overlay với 2 nút */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="none" size="none"
                  type="button"
                  onClick={() => handleRecrop(i)}
                  disabled={disabled || uploading || isCropping}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                  title={labels.UPLOADER.CUSTOMIZE_FRAME}
                >
                  <Crop size={13} />
                </Button>
                <Button
                  variant="none" size="none"
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={disabled || uploading || isCropping}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/70 text-white transition-colors"
                  title={labels.UPLOADER.DELETE_IMAGE}
                >
                  <X size={13} />
                </Button>
              </div>

              {/* Index badge */}
              <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/50 rounded px-1">
                {i + 1}
              </span>
            </div>
          ))}

          {/* Add more */}
          {canAddMore && (
            <div
              className={`relative w-20 h-20 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0
                ${isDragging
                  ? 'border-primary bg-orange-50 dark:bg-orange-950/20 scale-105'
                  : 'border-gray-300 dark:border-slate-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-slate-800/40'
                }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              title={labels.UPLOADER.ADD_IMAGE}
            >
              {images.length === 0 ? (
                <>
                  <ImageIcon size={20} className="text-gray-400" />
                  <span className="text-[9px] text-gray-400 font-medium text-center leading-tight">
                    Nhấp hoặc kéo<br />thả ảnh
                  </span>
                </>
              ) : (
                <>
                  <Plus size={18} className="text-primary" />
                  <span className="text-[9px] text-gray-500 font-medium">{labels.UPLOADER.ADD_IMAGE}</span>
                </>
              )}
            </div>
          )}

          {/* Uploading placeholder */}
          {(uploading || isCropping) && (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-1 shrink-0">
              <Loader2 size={18} className="animate-spin text-primary" />
              <span className="text-[9px] text-primary font-medium">
                {isCropping ? 'Đang crop...' : 'Đang tải...'}
              </span>
            </div>
          )}
        </div>

        {/* Footer counter */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Upload size={11} />
            {images.length === 0
              ? `Tối đa ${MAX_IMAGES} ảnh · ${MAX_FILE_SIZE_MB}MB mỗi ảnh · Có thể tùy chỉnh khung hình`
              : `${images.length}/${MAX_IMAGES} ảnh`}
          </span>
          {images.length > 0 && (
            <Button
              variant="none" size="none"
              type="button"
              onClick={() => onChange([])}
              disabled={disabled || uploading || isCropping}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        {/* Hidden input */}
        <Input
          variant="none"
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={!canAddMore}
        />
      </div>
    </>
  );
};
