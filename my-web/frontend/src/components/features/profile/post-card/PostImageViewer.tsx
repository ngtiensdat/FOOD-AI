/**
 * @fileoverview frontend/src/components/features/profile/post-card/PostImageViewer.tsx
 * @description Component hiển thị ảnh inline trong bài đăng.
 * - Mặc định: Hiển thị grid thumbnail (không zoom khi hover).
 * - Khi click: Mở rộng thành viewer carousel nằm trong bài đăng.
 * - Khi scroll bài đăng ra khỏi viewport: Tự động thu về grid.
 * - Không block scroll trang.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import SafeImage from '@/components/base/SafeImage';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface PostImageViewerProps {
  images: string[];
}

export function PostImageViewer({ images }: PostImageViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-collapse khi bài đăng cuộn ra ngoài viewport
  useEffect(() => {
    if (!expanded) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setExpanded(false); },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setExpanded(true);
  }, []);

  const close = useCallback(() => setExpanded(false), []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, prev, next, close]);

  if (images.length === 0) return null;

  return (
    <div ref={containerRef}>
      {expanded ? (
        /* ——— EXPANDED VIEWER ——— */
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-black shadow-xl">
          {/* Main image — full width, no hover scale */}
          <div className="relative w-full" style={{ height: 'clamp(240px, 55vw, 520px)' }}>
            <SafeImage
              key={activeIndex}
              src={images[activeIndex]}
              alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(activeIndex + 1)}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-contain"
            />

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="none"
                  size="none"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors backdrop-blur-sm"
                  aria-label={LABELS.IMAGE_VIEWER.PREV_IMAGE}
                >
                  <ChevronLeft size={22} />
                </Button>
                <Button
                  type="button"
                  variant="none"
                  size="none"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors backdrop-blur-sm"
                  aria-label={LABELS.IMAGE_VIEWER.NEXT_IMAGE}
                >
                  <ChevronRight size={22} />
                </Button>
              </>
            )}

            {/* Counter + Close */}
            <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-3 z-10">
              {images.length > 1 ? (
                <span className="text-white text-xs font-bold bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {activeIndex + 1} / {images.length}
                </span>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="none"
                size="none"
                onClick={close}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors backdrop-blur-sm"
                aria-label={LABELS.IMAGE_VIEWER.MINIMIZE}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 px-3 py-2.5 bg-black/90 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
              {images.map((url, i) => (
                <Button
                  key={url}
                  type="button"
                  variant="none"
                  size="none"
                  onClick={() => setActiveIndex(i)}
                  className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all border-2 ${
                    i === activeIndex
                      ? 'border-white scale-105'
                      : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                  aria-label={LABELS.IMAGE_VIEWER.VIEW_IMAGE_NUM(i + 1)}
                >
                  <SafeImage src={url} alt={LABELS.IMAGE_VIEWER.THUMB_NUM(i + 1)} fill sizes="56px" className="object-cover" />
                </Button>
              ))}
            </div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && images.length <= 5 && (
            <div className="flex justify-center gap-1.5 py-2 bg-black/90">
              {images.map((_, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="none"
                  size="none"
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all ${
                    i === activeIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                  aria-label={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 1)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ——— THUMBNAIL GRID ——— */
        <ImageGrid images={images} onClickImage={openAt} />
      )}
    </div>
  );
}

/* ——— Grid thumbnail — không zoom khi hover ——— */
function ImageGrid({
  images,
  onClickImage,
}: {
  images: string[];
  onClickImage: (index: number) => void;
}) {
  const count = images.length;

  // Overlay nhẹ khi hover để báo hiệu có thể click — không scale ảnh
  const hoverOverlay = (
    <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors duration-200 cursor-pointer" />
  );

  if (count === 1) {
    return (
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-sm cursor-pointer"
        style={{ height: 'clamp(200px, 50vw, 400px)' }}
        onClick={() => onClickImage(0)}
      >
        <SafeImage
          src={images[0]}
          alt={LABELS.IMAGE_VIEWER.POST_IMAGE}
          fill
          sizes="80vw"
          className="object-cover"
        />
        {hoverOverlay}
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
        {images.map((url, i) => (
          <div
            key={url}
            className="relative h-52 cursor-pointer overflow-hidden"
            onClick={() => onClickImage(i)}
          >
            <SafeImage src={url} alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 1)} fill sizes="40vw" className="object-cover" />
            {hoverOverlay}
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
        <div
          className="relative h-64 cursor-pointer overflow-hidden row-span-2"
          onClick={() => onClickImage(0)}
        >
          <SafeImage src={images[0]} alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(1)} fill sizes="40vw" className="object-cover" />
          {hoverOverlay}
        </div>
        {images.slice(1).map((url, i) => (
          <div
            key={url}
            className="relative cursor-pointer overflow-hidden"
            style={{ height: '124px' }}
            onClick={() => onClickImage(i + 1)}
          >
            <SafeImage src={url} alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 2)} fill sizes="40vw" className="object-cover" />
            {hoverOverlay}
          </div>
        ))}
      </div>
    );
  }

  // 4 hoặc 5 ảnh
  const main = images.slice(0, 4);
  const extra = images.length - 4;

  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
      {main.map((url, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <div
            key={url}
            className="relative h-40 cursor-pointer overflow-hidden"
            onClick={() => onClickImage(i)}
          >
            <SafeImage
              src={url}
              alt={LABELS.IMAGE_VIEWER.IMAGE_NUM(i + 1)}
              fill
              sizes="40vw"
              className={`object-cover ${isLast ? 'brightness-50' : ''}`}
            />
            {!isLast && hoverOverlay}
            {isLast && (
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl pointer-events-none">
                +{extra}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
