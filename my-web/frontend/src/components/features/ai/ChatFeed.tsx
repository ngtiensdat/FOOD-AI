// Mục đích file này để làm gì: Component giao diện hiển thị danh sách tin nhắn chat và các thẻ gợi ý món ăn kèm nút feedback (Like/Dislike).
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng trong AiChatWindow để hiển thị nội dung hội thoại giữa người dùng và AI.
// Các chức năng đặc biệt: Tải tin nhắn bất đồng bộ, render danh sách món ăn gợi ý dưới dạng MiniFoodCard và xử lý phản hồi trực quan.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Component Pattern.
// Các biến, hàm đặc biệt trong file: ChatFeed component.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, ChevronDown } from 'lucide-react';
import { MiniFoodCard } from '../food/MiniFoodCard';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { User as UserType } from '@/types/user';

import { ChatMessage } from '@/hooks/useAiChat';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/base/Button';

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading: boolean;
  chatFeedRef: React.RefObject<HTMLDivElement | null>;
  onViewDetail?: (food: FoodCardData) => void;
  onFeedback?: (foodId: number, type: 'LIKE' | 'DISLIKE') => void;
  user?: Partial<UserType> | null;
}

interface SuggestedFoodsSectionProps {
  suggestions?: FoodCardData[];
  otherSuggestions?: FoodCardData[];
  onViewDetail?: (food: FoodCardData) => void;
  onFeedback?: (foodId: number, type: 'LIKE' | 'DISLIKE') => void;
}

function SuggestedFoodsSection({
  suggestions,
  otherSuggestions,
  onViewDetail,
  onFeedback,
}: SuggestedFoodsSectionProps) {
  const [showOtherTop5, setShowOtherTop5] = React.useState(false);

  const hasPrimary = suggestions && suggestions.length > 0;
  const hasOthers = otherSuggestions && otherSuggestions.length > 0;

  if (!hasPrimary && !hasOthers) return null;

  return (
    <div className="pt-2 pl-1 space-y-3">
      {/* Header & Toggle Button */}
      <div className="flex items-center justify-between gap-2 max-w-2xl flex-wrap">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
          {LABELS.HERO.SUGGESTED_TITLE}
        </p>

        {/* Nút bấm xem các món điểm cao khác trong Top 5 */}
        {hasOthers && (
          <button
            type="button"
            onClick={() => setShowOtherTop5(!showOtherTop5)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-primary dark:text-orange-400 text-[11px] font-bold border border-orange-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-xs select-none"
          >
            <Sparkles size={12} className="text-primary dark:text-orange-400 animate-pulse" />
            <span>
              {showOtherTop5
                ? 'Thu gọn lựa chọn Top 5'
                : `Top 5 gợi ý: Xem thêm ${otherSuggestions.length} món khác`}
            </span>
            <ChevronDown
              size={13}
              className={`transform transition-transform duration-200 ${
                showOtherTop5 ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Món ăn chính được AI lựa chọn và giới thiệu */}
      {hasPrimary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {suggestions.map((food: FoodCardData) => (
            <div key={food.id} className="flex flex-col gap-2">
              <MiniFoodCard food={food} onViewDetail={onViewDetail} />
              <div className="flex items-center gap-2 pl-1 select-none">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (food.id !== undefined) {
                      onFeedback?.(Number(food.id), 'LIKE');
                    }
                  }}
                  variant="none"
                  size="none"
                  className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                    food.feedback === 'LIKE'
                      ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  {LABELS.AI_CHAT.FEED.FEEDBACK_LIKE}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (food.id !== undefined) {
                      onFeedback?.(Number(food.id), 'DISLIKE');
                    }
                  }}
                  variant="none"
                  size="none"
                  className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                    food.feedback === 'DISLIKE'
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  {LABELS.AI_CHAT.FEED.FEEDBACK_DISLIKE}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danh sách mở rộng các món điểm cao tiếp theo trong Top 5 */}
      {hasOthers && showOtherTop5 && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="pt-2 pb-1 border-t border-dashed border-orange-200/80 dark:border-slate-800 max-w-2xl space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
              Top 5 món điểm cao tiếp theo:
            </span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 italic">
              Lựa chọn thay thế phù hợp với khẩu vị & vị trí của bạn
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherSuggestions.map((food: FoodCardData, idx: number) => (
              <div key={food.id} className="flex flex-col gap-1.5 relative">
                <div className="relative">
                  <span className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    #{idx + 2}
                  </span>
                  <MiniFoodCard food={food} onViewDetail={onViewDetail} />
                </div>
                <div className="flex items-center gap-2 pl-1 select-none">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (food.id !== undefined) {
                        onFeedback?.(Number(food.id), 'LIKE');
                      }
                    }}
                    variant="none"
                    size="none"
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all ${
                      food.feedback === 'LIKE'
                        ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {LABELS.AI_CHAT.FEED.FEEDBACK_LIKE}
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (food.id !== undefined) {
                        onFeedback?.(Number(food.id), 'DISLIKE');
                      }
                    }}
                    variant="none"
                    size="none"
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all ${
                      food.feedback === 'DISLIKE'
                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {LABELS.AI_CHAT.FEED.FEEDBACK_DISLIKE}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function ChatFeed({
  messages,
  isLoading,
  chatFeedRef,
  onViewDetail,
  onFeedback,
  user,
}: ChatFeedProps) {
  const router = useRouter();
  const displayName = user?.profile?.fullName || user?.name || '';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2) || '?';
  const userAvatarUrl = user?.profile?.avatar || user?.avatar || null;
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
                    : 'bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  userAvatarUrl ? (
                    <SafeImage
                      src={userAvatarUrl}
                      alt={displayName || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : userInitials !== '?' ? (
                    <span className="text-[11px] font-black text-primary uppercase">{userInitials}</span>
                  ) : (
                    <User size={16} />
                  )
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
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed text-left ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 text-gray-700 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-left">{msg.content}</p>
                </div>

                {/* Nút bấm Đăng nhập / Đăng ký nếu là tin nhắn yêu cầu xác thực */}
                {msg.isAuthPrompt && (
                  <div className="pt-2 pl-1 flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => router.push('/login')}
                      variant="none"
                      size="none"
                      className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md hover:bg-orange-600 transition-all cursor-pointer"
                    >
                      {LABELS.AUTH.LOGIN}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push('/register')}
                      variant="none"
                      size="none"
                      className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      {LABELS.AUTH.REGISTER_NOW}
                    </Button>
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
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (food.id !== undefined) {
                                  onFeedback?.(Number(food.id), 'LIKE');
                                }
                              }}
                              variant="none"
                              size="none"
                              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                                food.feedback === 'LIKE'
                                  ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                              }`}
                            >
                              {LABELS.AI_CHAT.FEED.FEEDBACK_LIKE}
                            </Button>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (food.id !== undefined) {
                                  onFeedback?.(Number(food.id), 'DISLIKE');
                                }
                              }}
                              variant="none"
                              size="none"
                              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${
                                food.feedback === 'DISLIKE'
                                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                              }`}
                            >
                              {LABELS.AI_CHAT.FEED.FEEDBACK_DISLIKE}
                            </Button>
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
          <div className="flex items-center p-4 bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-400 dark:text-slate-400 italic">
            <span>{LABELS.HERO.AI_THINKING}</span>
          </div>
        </div>
      )}
    </div>
  );
}
