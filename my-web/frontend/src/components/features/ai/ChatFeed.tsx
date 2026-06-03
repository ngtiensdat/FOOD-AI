// Mục đích file này để làm gì: Component giao diện hiển thị danh sách tin nhắn chat và các thẻ gợi ý món ăn kèm nút feedback (Like/Dislike).
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng trong AiChatWindow để hiển thị nội dung hội thoại giữa người dùng và AI.
// Các chức năng đặc biệt: Tải tin nhắn bất đồng bộ, render danh sách món ăn gợi ý dưới dạng MiniFoodCard và xử lý phản hồi trực quan.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Component Pattern.
// Các biến, hàm đặc biệt trong file: ChatFeed component.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { MiniFoodCard } from '../food/MiniFoodCard';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

import { ChatMessage } from '@/hooks/useAiChat';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { useRouter } from 'next/navigation';

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading: boolean;
  chatFeedRef: React.RefObject<HTMLDivElement | null>;
  onViewDetail?: (food: FoodCardData) => void;
  onFeedback?: (foodId: number, type: 'LIKE' | 'DISLIKE') => void;
}

export function ChatFeed({
  messages,
  isLoading,
  chatFeedRef,
  onViewDetail,
  onFeedback,
}: ChatFeedProps) {
  const router = useRouter();
  return (
    <div
      ref={chatFeedRef}
      className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/50 dark:bg-slate-900/10"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-inner"
          >
            <div className="w-10 h-10 relative">
              <SafeImage
                src="/logo.png"
                alt={LABELS.COMMON.BRAND_LOGO_ALT}
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
          <h4 className="font-extrabold text-gray-800 dark:text-slate-200 text-lg mb-2">
            {LABELS.AI_CHAT.FEED.WELCOME}
          </h4>
          <p className="text-gray-400 dark:text-slate-500 text-sm max-w-sm">
            {LABELS.AI_CHAT.FEED.WELCOME_SUB}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm relative ${
                  msg.role === 'user'
                    ? 'bg-orange-100 text-primary'
                    : 'bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-850'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={16} />
                ) : (
                  <SafeImage
                    src="/logo.png"
                    alt={LABELS.COMMON.BRAND_LOGO_ALT}
                    fill
                    className="object-contain p-1"
                  />
                )}
              </div>

              {/* Bong bóng tin nhắn */}
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 text-gray-700 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Nút bấm Đăng nhập / Đăng ký nếu là tin nhắn yêu cầu xác thực */}
                {msg.isAuthPrompt && (
                  <div className="pt-2 pl-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md hover:bg-orange-600 transition-all cursor-pointer"
                    >
                      {LABELS.AUTH.LOGIN}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      {LABELS.AUTH.REGISTER_NOW}
                    </button>
                  </div>
                )}

                {/* Danh sách các thẻ món ăn gợi ý kiểu Mini (nếu có) */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 pl-1 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      {LABELS.HERO.SUGGESTED_TITLE}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                      {msg.suggestions.map((food: FoodCardData) => (
                        <div key={food.id} className="flex flex-col gap-2">
                          <MiniFoodCard
                            food={food}
                            onViewDetail={onViewDetail}
                          />
                          <div className="flex items-center gap-2 pl-1 select-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (food.id !== undefined) {
                                  onFeedback?.(Number(food.id), 'LIKE');
                                }
                              }}
                              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                                food.feedback === 'LIKE'
                                  ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                                  : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                              }`}
                            >
                              {LABELS.AI_CHAT.FEED.FEEDBACK_LIKE}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (food.id !== undefined) {
                                  onFeedback?.(Number(food.id), 'DISLIKE');
                                }
                              }}
                              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                                food.feedback === 'DISLIKE'
                                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                                  : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                              }`}
                            >
                              {LABELS.AI_CHAT.FEED.FEEDBACK_DISLIKE}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator của AI khi đang gõ */}
      {isLoading && (
        <div className="flex gap-3 max-w-[80%]">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800">
            <SafeImage
              src="/logo.png"
              alt={LABELS.COMMON.BRAND_LOGO_ALT}
              fill
              className="object-contain p-1 animate-spin"
            />
          </div>
          <div className="flex items-center p-4 bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-450 dark:text-slate-400 italic">
            <span>{LABELS.HERO.AI_THINKING}</span>
          </div>
        </div>
      )}
    </div>
  );
}
