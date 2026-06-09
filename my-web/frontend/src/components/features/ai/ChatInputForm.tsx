/**
 * Mục đích: Component input form để người dùng nhập tin nhắn và gửi tới AI Assistant, hiển thị các quick replies gợi ý.
 * File quan hệ: Được sử dụng trong AiChatWindow để lấy input từ người dùng.
 */
'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface ChatInputFormProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isLoading: boolean;
  quickReplies: Array<{ label: string; text: string }>;
  sendDirectMessage: (text: string) => void;
  handleSend: (e: React.FormEvent) => void;
  isAuthenticated: boolean;
}

export function ChatInputForm({
  inputValue,
  setInputValue,
  isLoading,
  quickReplies,
  sendDirectMessage,
  handleSend,
  isAuthenticated,
}: ChatInputFormProps) {
  return (
    <>
      {/* Gợi ý chọn nhanh các phản hồi/thông tin sinh bởi AI */}
      {quickReplies.length > 0 && !isLoading && (
        <div className="px-6 py-3 bg-orange-50/20 dark:bg-slate-900/20 border-t border-orange-50/50 dark:border-slate-800/50 z-10 animate-fade-in shrink-0">
          <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
            {LABELS.AI_CHAT.FEED.SUGGESTION}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendDirectMessage(opt.text)}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 hover:border-primary dark:hover:border-primary text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all shadow-sm hover:shadow"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vùng nhập liệu (Input Form) ở cuối */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4 border-t border-orange-50 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-md flex gap-3 items-center shrink-0 w-full"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isAuthenticated ? LABELS.AI_CHAT.INPUT.PLACEHOLDER : LABELS.AUTH.LOGIN_REQUIRED}
          disabled={isLoading || !isAuthenticated}
          className="flex-1 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 hover:border-orange-200 dark:hover:border-slate-700 px-4 py-3 rounded-2xl text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim() || !isAuthenticated}
          title={LABELS.AI_CHAT.FEED.SEND_MESSAGE}
          aria-label={LABELS.AI_CHAT.FEED.SEND_MESSAGE}
          className="p-3.5 rounded-2xl bg-primary text-white hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg focus:outline-none"
        >
          <Send size={18} />
        </button>
      </form>
    </>
  );
}
