// Mục đích: Sub-component hiển thị nội dung chính của bài viết (tiêu đề, nội dung, rating, liên kết món ăn / nhà hàng).
// Ý nghĩa: Tách biệt phần UI hiển thị khỏi PostCard.tsx. Chứa logic dẫn đến trang chi tiết món ăn/nhà hàng.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MapPin, Utensils } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { Button } from '@/components/base/Button';
import { PostImageViewer } from './PostImageViewer';
import { PostData } from '../PostCard';

interface PostContentProps {
  post: PostData;
}

/**
 * Gom tất cả ảnh của bài đăng thành một mảng hợp nhất.
 * Ưu tiên mảng `images`, fallback về `image` đơn lẻ. Loại bỏ trùng và rỗng.
 */
function resolvePostImages(image?: string | null, images?: string[]): string[] {
  if (images && images.length > 0) {
    const all = image ? [image, ...images.filter((u) => u !== image)] : images;
    return all.filter(Boolean);
  }
  return image ? [image] : [];
}

export function PostContent({ post }: PostContentProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const allImages = resolvePostImages(post.image, post.images);
  const isLongContent = post.content && (post.content.length > 150 || post.content.split('\n').length > 3);

  const sharedImages = (() => {
    if (!post.sharedFrom) return [];
    const sf = post.sharedFrom as { image?: string | null; images?: string[] };
    return resolvePostImages(sf.image, sf.images);
  })();

  return (
    <>
      {post.isShared ? (
        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-900/30 space-y-4">
          {/* Original Author Header */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => {
                if (post.sharedFrom?.id) router.push(`/profile?id=${post.sharedFrom.id}`);
              }}
              className={`flex items-center gap-2 ${post.sharedFrom?.id ? 'cursor-pointer' : ''}`}
            >
              <Avatar src={post.sharedFrom?.avatar} name={post.sharedFrom?.name || ''} size={28} />
              <span className="font-extrabold text-gray-800 dark:text-slate-200 text-xs hover:text-primary transition-colors">
                {post.sharedFrom?.name}
              </span>
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
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight break-words">
              {post.title}
            </h4>
            <p className={`text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {post.content}
            </p>
            {isLongContent && (
              <Button
                type="button"
                variant="none"
                size="none"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-[11px] font-bold text-primary hover:underline mt-1"
              >
                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
              </Button>
            )}
          </div>

          {/* Shared post images */}
          {sharedImages.length > 0 && <PostImageViewer images={sharedImages} />}
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
            <h4 className="text-body font-black text-gray-900 leading-tight break-words">{post.title}</h4>
            <p className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {post.content}
            </p>
            {isLongContent && (
              <Button
                type="button"
                variant="none"
                size="none"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-xs font-bold text-primary hover:underline mt-1"
              >
                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
              </Button>
            )}
          </div>

          {/* Post images — inline viewer */}
          {allImages.length > 0 && <PostImageViewer images={allImages} />}
        </>
      )}
    </>
  );
}
