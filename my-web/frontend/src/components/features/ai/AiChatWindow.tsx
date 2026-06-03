/**
 * Mục đích: Component giao diện chính hiển thị khung chat AI (sidebar danh sách hội thoại, chat feed, config drawer).
 * File quan hệ: Kết nối custom hook useAiChat và render các sub-component.
 */

'use client';

/**
 * Mục đích file này để làm gì: Component giao diện khung chat AI toàn diện (sidebar đa hội thoại, feed tin nhắn, khung nhập liệu, drawer giả lập ngữ cảnh).
 * Các file khác hay file này có ý nghĩa như nào: Sử dụng useAiChat hook để lấy logic, chỉ chịu trách nhiệm render giao diện.
 * Các chức năng đặc biệt: Hiển thị sidebar danh sách hội thoại, feed tin nhắn với animation, gợi ý nhanh, mock GPS/thời tiết drawer.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Presentational Component pattern, Separation of Concerns (chỉ UI, không logic).
 * Các biến, hàm đặc biệt trong file: AiChatWindow (Component), renderSidebar, renderChatFeed, renderConfigDrawer.
 */

import React from 'react';
import { 
  CloudSun, 
  PanelLeft, 
  X
} from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';
import { LABELS } from '@/constants/labels';
import { SafeImage } from '@/components/base/SafeImage';

// Import presentational subcomponents
import { ChatSidebar } from './ChatSidebar';
import { ChatConfigDrawer } from './ChatConfigDrawer';
import { ChatFeed } from './ChatFeed';
import { ChatInputForm } from './ChatInputForm';

import { FoodCardData } from '@/components/features/food/FoodCard';

interface AiChatWindowProps {
  onViewDetail?: (food: FoodCardData) => void;
  initialMessage?: string;
  onResetChat?: () => void;
}

export function AiChatWindow({ onViewDetail, initialMessage, onResetChat }: AiChatWindowProps) {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    quickReplies,
    isSidebarOpen,
    setIsSidebarOpen,
    conversations,
    activeConversationId,
    setActiveConversationId,
    showConfig,
    setShowConfig,
    temperature,
    setTemperature,
    isRaining,
    setIsRaining,
    lat,
    setLat,
    lng,
    setLng,
    chatFeedRef,
    sendDirectMessage,
    handleSend,
    handleCreateNewChat,
    handleDeleteChat,
    loadConversations,
    refreshGps,
    handleFeedback,
    isAuthenticated,
  } = useAiChat({ initialMessage, onResetChat });

  return (
    <div className="w-full max-w-4xl mx-auto flex h-[650px] rounded-3xl bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-800 shadow-2xl overflow-hidden glass relative">
      
      {/* Sidebar tương tự Chat GPT */}
      <ChatSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        handleCreateNewChat={handleCreateNewChat}
        handleDeleteChat={handleDeleteChat}
        loadConversations={loadConversations}
      />

      {/* Vùng chat chính (Main Chat Area) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header của Khung Chat */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-55 dark:border-slate-800 bg-orange-50/40 dark:bg-slate-900/30 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title={LABELS.AI_CHAT.HEADER.OPEN_SIDEBAR}
                aria-label={LABELS.AI_CHAT.HEADER.OPEN_SIDEBAR}
                className="p-2.5 rounded-xl hover:bg-orange-50/20 text-gray-500 dark:text-slate-400 transition-colors mr-1 border border-transparent hover:border-gray-250 dark:hover:border-slate-800"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 flex-shrink-0">
              <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain p-1.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100 text-sm md:text-base leading-none mb-1">
                {LABELS.COMMON.AI_ASSISTANT_NAME}
              </h3>
              <span className="text-[10px] md:text-xs text-green-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                {LABELS.AI_CHAT.HEADER.ACTIVE}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút cấu hình giả lập thời tiết / GPS */}
            <button 
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                showConfig 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:bg-orange-50/20'
              }`}
            >
              <CloudSun size={14} />
              {LABELS.AI_CHAT.HEADER.SIMULATE_CONTEXT}
            </button>

            {/* Nút Đóng / Thu gọn Khung Chat Trực tiếp */}
            {onResetChat && (
              <button
                type="button"
                onClick={onResetChat}
                title={LABELS.AI_CHAT.HEADER.COLLAPSE_CHAT}
                aria-label={LABELS.AI_CHAT.HEADER.COLLAPSE_CHAT}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 hover:text-red-500 hover:border-red-200 dark:hover:border-red-950/20 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Bảng cấu hình ngữ cảnh giả lập (Thời tiết / Vị trí) */}
        <ChatConfigDrawer
          showConfig={showConfig}
          setShowConfig={setShowConfig}
          temperature={temperature}
          setTemperature={setTemperature}
          isRaining={isRaining}
          setIsRaining={setIsRaining}
          lat={lat}
          setLat={setLat}
          lng={lng}
          setLng={setLng}
          refreshGps={refreshGps}
        />

        {/* Vùng hiển thị Danh sách Tin nhắn (Chat Feed) */}
        <ChatFeed
          messages={messages}
          isLoading={isLoading}
          chatFeedRef={chatFeedRef}
          onViewDetail={onViewDetail}
          onFeedback={handleFeedback}
        />

        {/* Vùng nhập liệu (Input Form) ở cuối */}
        <ChatInputForm
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          quickReplies={quickReplies}
          sendDirectMessage={sendDirectMessage}
          handleSend={handleSend}
          isAuthenticated={isAuthenticated}
        />

      </div>
    </div>
  );
}
