// Mục đích: Sub-component hiển thị nội dung chính của bài viết (tiêu đề, nội dung, rating, liên kết món ăn / nhà hàng).
// Ý nghĩa: Tách biệt phần UI hiển thị khỏi PostCard.tsx. Chứa logic dẫn đến trang chi tiết món ăn/nhà hàng.
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, MapPin, Utensils } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import SafeImage from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { PostData } from '../PostCard';

interface PostContentProps {
  post: PostData;
}

export function PostContent({ post }: PostContentProps) {
  const router = useRouter();

  return (
    <>
      {post.isShared ? (
        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-900/30 space-y-4">
          {/* Original Author Header */}
          <div className="flex items-center gap-2">
            <div 
              onClick={() => {
                if (post.sharedFrom?.id) {
                  router.push(`/profile?id=${post.sharedFrom.id}`);
                }
              }}
              className={`flex items-center gap-2 ${post.sharedFrom?.id ? 'cursor-pointer group/orig-author' : ''}`}
            >
              <Avatar src={post.sharedFrom?.avatar} name={post.sharedFrom?.name || ''} size={28} />
              <div>
                <span className="font-extrabold text-gray-800 dark:text-slate-200 text-xs hover:text-primary transition-colors block">
                  {post.sharedFrom?.name}
                </span>
              </div>
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
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{post.title}</h4>
            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Original Post Image */}
          {post.image && (
            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <SafeImage
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}
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
            <h4 className="text-body font-black text-gray-900 leading-tight">{post.title}</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
              <SafeImage
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
