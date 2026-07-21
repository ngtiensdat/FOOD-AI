'use client';

import React from 'react';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';

interface AccountTabProps {
  user: Partial<User> | null;
}

export function AccountTab({ user }: AccountTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
          {LABELS.AI_CHAT.PREFERENCES.TAB_ACCOUNT}
        </h4>

        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800 pb-2">
            {LABELS.AI_CHAT.PREFERENCES.ACCOUNT_INFO_TITLE}
          </p>

          <div className="grid grid-cols-3 gap-y-3 text-xs font-bold">
            <span className="text-slate-400">{LABELS.AI_CHAT.PREFERENCES.ACCOUNT_NAME}:</span>
            <span className="col-span-2 text-slate-800 dark:text-slate-200">{user?.name || LABELS.COMMON.UNKNOWN}</span>
            
            <span className="text-slate-400">{LABELS.AI_CHAT.PREFERENCES.ACCOUNT_EMAIL}:</span>
            <span className="col-span-2 text-slate-800 dark:text-slate-200">{user?.email || LABELS.COMMON.UNKNOWN}</span>
            
            <span className="text-slate-400">{LABELS.AI_CHAT.PREFERENCES.ACCOUNT_ROLE}:</span>
            <span className="col-span-2 uppercase text-orange-500 font-extrabold text-[10px] tracking-wider mt-0.5">{user?.role || LABELS.COMMON.UNKNOWN}</span>

            <span className="text-slate-400">{LABELS.AI_CHAT.PREFERENCES.ACCOUNT_PLAN}:</span>
            <span className="col-span-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-primary text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                {LABELS.AI_CHAT.SIDEBAR.FREE_PLAN}
              </span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
