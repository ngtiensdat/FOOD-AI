'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import SafeImage from '@/components/base/SafeImage';
import { Button } from '@/components/base/Button';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
}

interface FeedbackItem {
  id: number;
  foodId: number;
  feedbackType: 'LIKE' | 'DISLIKE';
  food: FoodItem;
}

interface PersonalizationTabProps {
  loading: boolean;
  activeSubTab: 'like' | 'dislike';
  setActiveSubTab: (tab: 'like' | 'dislike') => void;
  likedItems: FeedbackItem[];
  dislikedItems: FeedbackItem[];
  currentItems: FeedbackItem[];
  removingId: number | null;
  onRemoveFeedback: (item: FeedbackItem) => void;
}

export function PersonalizationTab({
  loading,
  activeSubTab,
  setActiveSubTab,
  likedItems,
  dislikedItems,
  currentItems,
  removingId,
  onRemoveFeedback,
}: PersonalizationTabProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 shrink-0">
        {LABELS.AI_CHAT.PREFERENCES.TAB_PERSONALIZATION}
      </h4>

      {/* Subtab Thích / Ghét */}
      <div className="flex gap-4 border-b border-orange-50/50 dark:border-slate-800/60 mb-4 shrink-0">
        <Button
          id="preference-modal-tab-like"
          onClick={() => setActiveSubTab('like')}
          variant="none"
          size="none"
          className={`pb-2.5 text-[11px] font-extrabold transition-all relative flex items-center gap-1.5 ${
            activeSubTab === 'like'
              ? 'text-orange-500'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <Heart size={12} fill={activeSubTab === 'like' ? 'currentColor' : 'none'} />
          {LABELS.AI_CHAT.PREFERENCES.TAB_LIKED} ({likedItems.length})
          {activeSubTab === 'like' && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
            />
          )}
        </Button>
        <Button
          id="preference-modal-tab-dislike"
          onClick={() => setActiveSubTab('dislike')}
          variant="none"
          size="none"
          className={`pb-2.5 text-[11px] font-extrabold transition-all relative flex items-center gap-1.5 ${
            activeSubTab === 'dislike'
              ? 'text-orange-500'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <EyeOff size={12} />
          {LABELS.AI_CHAT.PREFERENCES.TAB_DISLIKED} ({dislikedItems.length})
          {activeSubTab === 'dislike' && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
            />
          )}
        </Button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-2 py-10">
            <Loader2 size={24} className="text-orange-500 animate-spin" />
            <span className="text-[11px] text-slate-400 font-bold">{LABELS.AI_CHAT.PREFERENCES.LOADING}</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-orange-100 dark:border-slate-800 rounded-2xl bg-orange-50/5 dark:bg-slate-900/5">
            {activeSubTab === 'like' ? (
              <Heart size={32} className="text-orange-200 dark:text-slate-800 mb-2" />
            ) : (
              <EyeOff size={32} className="text-orange-200 dark:text-slate-800 mb-2" />
            )}
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {LABELS.AI_CHAT.PREFERENCES.EMPTY_LIST}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[280px]">
              {activeSubTab === 'like'
                ? LABELS.AI_CHAT.PREFERENCES.EMPTY_LIKED_DESC
                : LABELS.AI_CHAT.PREFERENCES.EMPTY_DISLIKED_DESC}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:border-orange-100/50 dark:hover:border-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Image */}
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200/50 dark:border-slate-800">
                    {item.food.image ? (
                      <SafeImage
                        src={getValidImageUrl(item.food.image)}
                        alt={item.food.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="text-[9px] font-bold">No img</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                      {item.food.name}
                    </h4>
                    <p className="text-[10px] font-bold text-orange-500 mt-0.5">
                      {formatCurrency(item.food.price)}
                    </p>
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  id={`preference-modal-remove-button-${item.foodId}`}
                  onClick={() => onRemoveFeedback(item)}
                  disabled={removingId === item.foodId}
                  title={LABELS.AI_CHAT.PREFERENCES.TOOLTIP_REMOVE}
                  variant="none"
                  size="none"
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  {removingId === item.foodId ? (
                    <Loader2 size={12} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
