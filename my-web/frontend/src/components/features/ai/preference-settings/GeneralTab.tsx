'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Input } from '@/components/base/Input';

interface GeneralTabProps {
  theme: 'mixed' | 'light' | 'dark';
  setTheme: (theme: 'mixed' | 'light' | 'dark') => void;
  lang: 'auto' | 'vi' | 'en';
  onChangeLang: (lang: 'auto' | 'vi' | 'en') => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
}

export function GeneralTab({
  theme,
  setTheme,
  lang,
  onChangeLang,
  voiceEnabled,
  setVoiceEnabled,
}: GeneralTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
          {LABELS.AI_CHAT.PREFERENCES.TAB_GENERAL}
        </h4>
        
        {/* Giao diện (Theme) */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {LABELS.AI_CHAT.PREFERENCES.THEME_LABEL}
            </p>
          </div>
          <select
            id="preference-modal-theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'mixed' | 'light' | 'dark')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="mixed">{LABELS.AI_CHAT.PREFERENCES.THEME_MIXED}</option>
            <option value="light">{LABELS.AI_CHAT.PREFERENCES.THEME_LIGHT}</option>
            <option value="dark">{LABELS.AI_CHAT.PREFERENCES.THEME_DARK}</option>
          </select>
        </div>

        {/* Ngôn ngữ */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {LABELS.AI_CHAT.PREFERENCES.LANG_LABEL}
            </p>
          </div>
           <select
            id="preference-modal-lang-select"
            value={lang}
            onChange={(e) => onChangeLang(e.target.value as 'auto' | 'vi' | 'en')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="auto">{LABELS.AI_CHAT.PREFERENCES.LANG_AUTO}</option>
            <option value="vi">{LABELS.AI_CHAT.PREFERENCES.LANG_VI}</option>
            <option value="en">{LABELS.AI_CHAT.PREFERENCES.LANG_EN}</option>
          </select>
        </div>

        {/* Giọng nói (Voice input) */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-slate-400" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {LABELS.AI_CHAT.PREFERENCES.VOICE_INPUT_LABEL}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <Input
              id="preference-modal-voice-toggle"
              variant="none"
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled((e.target as HTMLInputElement).checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
          </label>
        </div>

      </div>
    </div>
  );
}
