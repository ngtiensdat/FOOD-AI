/**
 * @fileoverview frontend/src/components/base/ImageLightbox.tsx
 * @description Lightbox xem ảnh toàn màn hình với điều hướng qua lại bằng phím và nút.
 */
'use client';

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import SafeImage from './SafeImage';
import { Button } from './Button';
import { LABELS } from '@/constants/labels';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="none" size="none"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label={LABELS.COMMON.CLOSE}
      >
        <X size={24} />
      </Button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold bg-black/40 px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto px-16 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <SafeImage
            src={images[currentIndex]}
            alt={`Ảnh ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="none" size="none"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
            aria-label={LABELS.IMAGE_VIEWER.PREV_IMAGE}
          >
            <ChevronLeft size={28} />
          </Button>
          <Button
            variant="none" size="none"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
            aria-label={LABELS.IMAGE_VIEWER.NEXT_IMAGE}
          >
            <ChevronRight size={28} />
          </Button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, i) => (
              <Button
                variant="none" size="none"
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                className={`rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
