// Mục đích file này để làm gì: Component Sidebar quản lý danh sách cuộc hội thoại gần đây (ChatGPT style).
// Các file khác hay file này có ý nghĩa như nào: Được tích hợp vào AiChatWindow, cung cấp điều hướng cuộc trò chuyện và nút mở Modal cài đặt sở thích.
// Các chức năng đặc biệt: Tạo mới đoạn chat, xóa đoạn chat, đóng mở sidebar thu phóng mượt mà.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Sidebar Component, State Propagation.
// Các biến, hàm đặc biệt trong file: ChatSidebar component.
'use client';

import React from 'react';
import { Plus, PanelLeftClose, MessageSquare, Trash2, Settings } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { SafeImage } from '@/components/base/SafeImage';
import { User } from '@/types/user';
import { Button } from '@/components/base/Button';

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  conversations: any[];
  activeConversationId: number | null;
  setActiveConversationId: (id: number) => void;
  handleCreateNewChat: () => void;
  handleDeleteChat: (e: React.MouseEvent, id: number) => void;
  loadConversations: () => void;
  onOpenSettings: () => void;
  user?: Partial<User> | null;
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
  onOpenSettings,
  user,
}: ChatSidebarProps) {
  const displayName = user?.profile?.fullName || user?.name || LABELS.AI_CHAT.SIDEBAR.CUSTOMER;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
  const avatarUrl = user?.profile?.avatar || user?.avatar || null;
  return (
    <div
      className={`h-full border-r border-orange-100/10 dark:border-slate-800/30 bg-slate-950 text-slate-200 transition-all duration-300 flex flex-col overflow-hidden relative shrink-0 z-20 ${
        isSidebarOpen ? 'w-64' : 'w-0 border-r-0'
      }`}
    >
      {/* Header Sidebar */}
      <div className="p-4 border-b border-slate-800/40 flex items-center justify-between gap-2 shrink-0">
        <Button
          id="chat-sidebar-new-chat-button"
          type="button"
          onClick={handleCreateNewChat}
          variant="none"
          size="none"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-primary hover:from-orange-600 hover:to-orange-600 text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={14} />
          {LABELS.AI_CHAT.SIDEBAR.NEW_CHAT}
        </Button>

        <Button
          id="chat-sidebar-close-button"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          title={LABELS.AI_CHAT.SIDEBAR.CLOSE_SIDEBAR}
          aria-label={LABELS.AI_CHAT.SIDEBAR.CLOSE_SIDEBAR}
          variant="none"
          size="none"
          className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
        >
          <PanelLeftClose size={16} />
        </Button>
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
              id={`chat-sidebar-conv-item-${conv.id}`}
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
              <Button
                id={`chat-sidebar-delete-button-${conv.id}`}
                type="button"
                onClick={(e) => handleDeleteChat(e, conv.id)}
                title={LABELS.AI_CHAT.SIDEBAR.DELETE_CHAT}
                aria-label={LABELS.AI_CHAT.SIDEBAR.DELETE_CHAT}
                variant="none"
                size="none"
                className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-inner relative">
            {avatarUrl ? (
              <SafeImage
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-primary flex items-center justify-center text-white text-xs font-black uppercase">
                {initials}
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-extrabold text-white truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-500 font-bold truncate">
              {user?.email || LABELS.AI_CHAT.SIDEBAR.FREE_PLAN}
            </p>
          </div>
        </div>

        <Button
          id="chat-sidebar-settings-button"
          type="button"
          onClick={onOpenSettings}
          title={LABELS.AI_CHAT.PREFERENCES.TITLE}
          aria-label={LABELS.AI_CHAT.PREFERENCES.TITLE}
          variant="none"
          size="none"
          className="p-2 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors"
        >
          <Settings size={14} />
        </Button>
      </div>
    </div>
  );
}
