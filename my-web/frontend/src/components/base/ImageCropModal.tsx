/**
 * @fileoverview frontend/src/components/base/ImageCropModal.tsx
 * @description Modal cho phép người dùng tùy chỉnh khung hình (crop + xoay + zoom) trước khi upload.
 * Luôn cho phép chọn vùng tự do (không có aspect ratio cố định trừ avatar/cover).
 */
'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ImageCropModalProps {
  /** Object-URL hoặc data-URL của ảnh gốc */
  imageSrc: string;
  /** Tỉ lệ khung hình cố định. Undefined = tự do */
  aspect?: number;
  /** Label mô tả ngữ cảnh (vd: "Ảnh đại diện", "Ảnh bài đăng 1/3") */
  cropLabel?: string;
  /** Callback khi xác nhận — nhận Blob ảnh đã crop */
  onConfirm: (croppedBlob: Blob) => void;
  /** Callback khi hủy */
  onCancel: () => void;
}

// ---------- Canvas crop helper ----------
async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea, rotation = 0): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const rad = (rotation * Math.PI) / 180;
  const { naturalWidth: w, naturalHeight: h } = image;
  const bBoxW = Math.abs(Math.cos(rad) * w) + Math.abs(Math.sin(rad) * h);
  const bBoxH = Math.abs(Math.sin(rad) * w) + Math.abs(Math.cos(rad) * h);

  canvas.width = bBoxW;
  canvas.height = bBoxH;
  ctx.translate(bBoxW / 2, bBoxH / 2);
  ctx.rotate(rad);
  ctx.drawImage(image, -w / 2, -h / 2);

  const out = document.createElement('canvas');
  out.width = pixelCrop.width;
  out.height = pixelCrop.height;
  const outCtx = out.getContext('2d')!;
  outCtx.drawImage(canvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ---------- Component ----------
export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  aspect,
  cropLabel = 'Ảnh',
  onConfirm,
  onCancel,
}) => {
  const labels = LABELS;
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } catch {
      toast.error(labels.UPLOADER.CROP_ERROR);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, onConfirm]);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
              {labels.UPLOADER.CROP_TITLE}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {cropLabel} {labels.UPLOADER.CROP_DESC}
            </p>
          </div>
          <Button
            type="button"
            variant="none"
            size="none"
            onClick={onCancel}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Crop canvas */}
        <div className="relative bg-gray-900" style={{ height: '340px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4 border-t border-gray-100 dark:border-slate-800">
          {/* Rotate/Zoom Controls */}
          <div className="space-y-4 px-1">
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-gray-400" />
              <Input
                variant="none"
                type="range"
                title={labels.UPLOADER.CROP_ZOOM} min={1} max={3} step={0.05} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
                aria-label="Zoom"
              />
              <ZoomIn size={15} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-3">
              <RotateCcw size={16} className="text-gray-400" />
              <Input
                variant="none"
                type="range"
                title={labels.UPLOADER.CROP_ROTATE} min={-180} max={180} step={1} value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
                aria-label="Xoay"
              />
              <span className="text-xs text-gray-500 w-10 text-right">{rotation}°</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="none"
              size="none"
              onClick={resetCrop}
              className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              {labels.UPLOADER.CROP_RESET}
            </Button>
            <div className="flex flex-1 gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1 rounded-xl"
              >
                {labels.UPLOADER.CROP_CANCEL}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20"
              >
                {isProcessing ? labels.UPLOADER.CROP_PROCESSING : (
                  <>
                    <Check size={16} className="mr-1.5" />
                    {labels.UPLOADER.CROP_APPLY}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
