'use client';

import React from 'react';
import { Plus, PanelLeftClose, MessageSquare, Trash2, RotateCcw } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  conversations: any[];
  activeConversationId: number | null;
  setActiveConversationId: (id: number) => void;
  handleCreateNewChat: () => void;
  handleDeleteChat: (e: React.MouseEvent, id: number) => void;
  loadConversations: () => void;
}

export function ChatSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  conversations,
  activeConversationId,
  setActiveConversationId,
  handleCreateNewChat,
  handleDeleteChat,
  loadConversations,
}: ChatSidebarProps) {
  return (
    <div
      className={`h-full border-r border-orange-100/10 dark:border-slate-800/30 bg-slate-950 text-slate-200 transition-all duration-300 flex flex-col overflow-hidden relative shrink-0 z-20 ${
        isSidebarOpen ? 'w-64' : 'w-0 border-r-0'
      }`}
    >
      {/* Header Sidebar */}
      <div className="p-4 border-b border-slate-800/40 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCreateNewChat}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-primary hover:from-orange-600 hover:to-orange-600 text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={14} />
          {LABELS.AI_CHAT.SIDEBAR.NEW_CHAT}
        </button>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          title={LABELS.AI_CHAT.SIDEBAR.CLOSE_SIDEBAR}
          aria-label={LABELS.AI_CHAT.SIDEBAR.CLOSE_SIDEBAR}
          className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Danh sách các đoạn chat gần đây */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
          {LABELS.AI_CHAT.SIDEBAR.RECENT}
        </p>
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-600 italic">
            {LABELS.AI_CHAT.SIDEBAR.NO_CHAT}
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                activeConversationId === conv.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <MessageSquare size={14} className="shrink-0 text-orange-500" />
                <span className="truncate">{conv.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleDeleteChat(e, conv.id)}
                title={LABELS.AI_CHAT.SIDEBAR.DELETE_CHAT}
                aria-label={LABELS.AI_CHAT.SIDEBAR.DELETE_CHAT}
                className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-primary flex items-center justify-center text-white text-xs font-black shrink-0 shadow-inner uppercase">
            KH
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-extrabold text-white truncate">
              {LABELS.AI_CHAT.SIDEBAR.CUSTOMER}
            </p>
            <p className="text-[10px] text-slate-500 font-bold truncate">
              {LABELS.AI_CHAT.SIDEBAR.FREE_PLAN}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            loadConversations();
          }}
          title={LABELS.AI_CHAT.SIDEBAR.REFRESH_LIST}
          aria-label={LABELS.AI_CHAT.SIDEBAR.REFRESH_LIST}
          className="p-2 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
