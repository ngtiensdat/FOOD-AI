'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { MiniFoodCard } from '../food/MiniFoodCard';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

interface ChatFeedProps {
  messages: any[];
  isLoading: boolean;
  chatFeedRef: React.RefObject<HTMLDivElement | null>;
  onViewDetail?: (food: any) => void;
}

export function ChatFeed({
  messages,
  isLoading,
  chatFeedRef,
  onViewDetail,
}: ChatFeedProps) {
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

                {/* Danh sách các thẻ món ăn gợi ý kiểu Mini (nếu có) */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 pl-1 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      {LABELS.HERO.SUGGESTED_TITLE}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                      {msg.suggestions.map((food: any) => (
                        <MiniFoodCard
                          key={food.id}
                          food={food}
                          onViewDetail={onViewDetail}
                        />
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
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-400 italic">
            <div className="w-4 h-4 relative animate-spin shrink-0">
              <SafeImage
                src="/logo.png"
                alt={LABELS.COMMON.BRAND_LOGO_ALT}
                fill
                className="object-contain"
              />
            </div>
            <span>{LABELS.HERO.AI_THINKING}</span>
          </div>
        </div>
      )}
    </div>
  );
}
