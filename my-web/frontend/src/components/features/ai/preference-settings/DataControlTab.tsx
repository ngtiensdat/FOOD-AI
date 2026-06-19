'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';

interface DataControlTabProps {
  clearingFeedbacks: boolean;
  onClearAllFeedbacks: () => void;
}

export function DataControlTab({
  clearingFeedbacks,
  onClearAllFeedbacks,
}: DataControlTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
          {LABELS.AI_CHAT.PREFERENCES.TAB_DATA_CONTROL}
        </h4>

        <div className="p-4 rounded-2xl border border-red-100 dark:border-red-950/30 bg-red-50/10 dark:bg-red-950/5 space-y-4">
          <div>
            <p className="text-xs font-extrabold text-red-600 dark:text-red-400">
              {LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_TITLE}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1.5 leading-relaxed">
              {LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_DESC}
            </p>
          </div>
          
          <Button
            id="preference-modal-clear-all-btn"
            onClick={onClearAllFeedbacks}
            disabled={clearingFeedbacks}
            variant="none"
            size="none"
            className="px-4 py-2 text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {clearingFeedbacks ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_BTN}
          </Button>
        </div>

      </div>
    </div>
  );
}
