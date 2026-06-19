// Mục đích file này để làm gì: Component giao diện khung chat AI toàn diện (sidebar đa hội thoại, feed tin nhắn, khung nhập liệu, drawer giả lập ngữ cảnh).
// Các file khác hay file này có ý nghĩa như nào: Sử dụng useAiChat hook để lấy logic nghiệp vụ, chịu trách nhiệm render toàn bộ layout giao diện chatbot AI.
// Các chức năng đặc biệt: Hiển thị sidebar danh sách hội thoại, feed tin nhắn với animation, gợi ý nhanh, mock GPS/thời tiết drawer và modal cài đặt.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Presentational Component pattern, Separation of Concerns (chỉ UI, không logic).
// Các biến, hàm đặc biệt trong file: AiChatWindow component.
'use client';

import React from 'react';
import { 
  CloudSun, 
  PanelLeft, 
  X
} from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';
import { LABELS } from '@/constants/labels';
import { SafeImage } from '@/components/base/SafeImage';
import { Button } from '@/components/base/Button';

// Import presentational subcomponents
import { ChatSidebar } from './ChatSidebar';
import { ChatConfigDrawer } from './ChatConfigDrawer';
import { ChatFeed } from './ChatFeed';
import { ChatInputForm } from './ChatInputForm';
import { PreferenceSettingsModal } from './PreferenceSettingsModal';

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
    weather,
    isWeatherLoading,
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
    user,
    reloadActiveConversation,
  } = useAiChat({ initialMessage, onResetChat });

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto flex h-[650px] rounded-3xl bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-800 shadow-2xl overflow-hidden glass relative text-left font-outfit [&_input]:text-left [&_input]:font-outfit [&_button]:font-outfit [&_select]:font-outfit [&_textarea]:font-outfit">
      
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
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
      />

      {/* Vùng chat chính (Main Chat Area) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header của Khung Chat */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 dark:border-slate-800 bg-orange-50/40 dark:bg-slate-900/30 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title={LABELS.AI_CHAT.HEADER.OPEN_SIDEBAR}
                aria-label={LABELS.AI_CHAT.HEADER.OPEN_SIDEBAR}
                variant="none"
                size="none"
                className="p-2.5 rounded-xl hover:bg-orange-50/20 text-gray-500 dark:text-slate-400 transition-colors mr-1 border border-transparent hover:border-gray-200 dark:hover:border-slate-800"
              >
                <PanelLeft size={16} />
              </Button>
            )}
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 flex-shrink-0">
              <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain p-1.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100 text-sm md:text-base leading-none mb-1">
                {LABELS.COMMON.AI_ASSISTANT_NAME}
              </h3>
              {isAuthenticated && (
                <span className="text-[10px] md:text-xs text-green-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  {LABELS.AI_CHAT.HEADER.ACTIVE}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút cấu hình giả lập thời tiết / GPS */}
            <Button 
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              variant="none"
              size="none"
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                showConfig 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:bg-orange-50/20'
              }`}
            >
              <CloudSun size={14} />
              {LABELS.AI_CHAT.HEADER.SIMULATE_CONTEXT}
            </Button>

            {/* Nút Đóng / Thu gọn Khung Chat Trực tiếp */}
            {onResetChat && (
              <Button
                type="button"
                onClick={onResetChat}
                title={LABELS.AI_CHAT.HEADER.COLLAPSE_CHAT}
                aria-label={LABELS.AI_CHAT.HEADER.COLLAPSE_CHAT}
                variant="none"
                size="none"
                className="p-2 rounded-xl bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 hover:text-red-500 hover:border-red-200 dark:hover:border-red-950/20 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Bảng cấu hình ngữ cảnh giả lập (Thời tiết / Vị trí) */}
        <ChatConfigDrawer
          showConfig={showConfig}
          setShowConfig={setShowConfig}
          weather={weather}
          isWeatherLoading={isWeatherLoading}
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
          user={user}
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

        {/* Modal Cài đặt sở thích Like / Dislike */}
        <PreferenceSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            reloadActiveConversation();
          }}
          activeConversationId={activeConversationId}
        />

      </div>
    </div>
  );
}
