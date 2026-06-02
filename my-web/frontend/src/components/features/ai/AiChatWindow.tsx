'use client';

/**
 * Mục đích file này để làm gì: Component giao diện khung chat AI toàn diện (sidebar đa hội thoại, feed tin nhắn, khung nhập liệu, drawer giả lập ngữ cảnh).
 * Các file khác hay file này có ý nghĩa như nào: Sử dụng useAiChat hook để lấy logic, chỉ chịu trách nhiệm render giao diện.
 * Các chức năng đặc biệt: Hiển thị sidebar danh sách hội thoại, feed tin nhắn với animation, gợi ý nhanh, mock GPS/thời tiết drawer.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Presentational Component pattern, Separation of Concerns (chỉ UI, không logic).
 * Các biến, hàm đặc biệt trong file: AiChatWindow (Component), renderSidebar, renderChatFeed, renderConfigDrawer.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  RotateCcw, 
  MapPin, 
  CloudSun, 
  Thermometer, 
  User,
  Plus, 
  Trash2, 
  MessageSquare, 
  PanelLeft, 
  PanelLeftClose,
  X
} from 'lucide-react';
import { MiniFoodCard } from '../food/MiniFoodCard';
import { useAiChat } from '@/hooks/useAiChat';
import { LABELS } from '@/constants/labels';
import { SafeImage } from '@/components/base/SafeImage';

interface AiChatWindowProps {
  onViewDetail?: (food: any) => void;
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
  } = useAiChat({ initialMessage, onResetChat });

  return (
    <div className="w-full max-w-4xl mx-auto flex h-[650px] rounded-3xl bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-800 shadow-2xl overflow-hidden glass relative">
      
      {/* Sidebar tương tự Chat GPT */}
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
            <p className="px-3 py-2 text-xs text-slate-600 italic">{LABELS.AI_CHAT.SIDEBAR.NO_CHAT}</p>
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
              <p className="text-xs font-extrabold text-white truncate">{LABELS.AI_CHAT.SIDEBAR.CUSTOMER}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate">{LABELS.AI_CHAT.SIDEBAR.FREE_PLAN}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => { loadConversations(); }}
            title={LABELS.AI_CHAT.SIDEBAR.REFRESH_LIST}
            aria-label={LABELS.AI_CHAT.SIDEBAR.REFRESH_LIST}
            className="p-2 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

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
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-b border-orange-50 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/10 px-6 py-4 shrink-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Giả lập Thời tiết */}
                <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850">
                  <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Thermometer size={14} className="text-orange-500" />
                    {LABELS.AI_CHAT.CONFIG.WEATHER_TITLE}
                  </span>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-gray-500">
                      {LABELS.AI_CHAT.CONFIG.TEMPERATURE}: <strong className="text-primary">{temperature}°C</strong>
                    </span>
                    <input 
                      type="range" 
                      min={LABELS.AI_CHAT.CONFIG.WEATHER_TEMP_LIMITS.MIN} 
                      max={LABELS.AI_CHAT.CONFIG.WEATHER_TEMP_LIMITS.MAX} 
                      value={temperature} 
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-24 accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.STATUS}:</span>
                    <button
                      type="button"
                      onClick={() => setIsRaining(!isRaining)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                        isRaining 
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                          : 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-770'
                      }`}
                    >
                      {isRaining ? LABELS.AI_CHAT.CONFIG.RAINY : LABELS.AI_CHAT.CONFIG.DRY}
                    </button>
                  </div>
                </div>

                {/* Giả lập Tọa độ GPS */}
                <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850">
                  <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-500" />
                    {LABELS.AI_CHAT.CONFIG.LOCATION_TITLE}
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500">Vĩ độ (Lat)</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={lat}
                        onChange={(e) => setLat(Number(e.target.value))}
                        className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-750 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500">Kinh độ (Lng)</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={lng}
                        onChange={(e) => setLng(Number(e.target.value))}
                        className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-750 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.GPS_COORDS}:</span>
                    <button
                      type="button"
                      title={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
                      aria-label={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
                      onClick={refreshGps}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-primary transition-colors font-bold text-[10px]"
                    >
                      <MapPin size={12} />
                      Cập nhật
                    </button>
                  </div>
                </div>

                {/* Hướng dẫn kiểm thử */}
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850 flex flex-col justify-center text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
                  <p className="font-bold text-gray-700 dark:text-slate-300 mb-1">{LABELS.AI_CHAT.CONFIG.TIPS_TITLE}</p>
                  <p>{LABELS.AI_CHAT.CONFIG.TIP_1}</p>
                  <p>{LABELS.AI_CHAT.CONFIG.TIP_2}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vùng hiển thị Danh sách Tin nhắn (Chat Feed) */}
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
                  <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain" />
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
                  <div className={`w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm relative ${
                    msg.role === 'user' 
                      ? 'bg-orange-100 text-primary' 
                      : 'bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-850'
                  }`}>
                    {msg.role === 'user' ? (
                      <User size={16} />
                    ) : (
                      <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain p-1" />
                    )}
                  </div>

                  {/* Bong bóng tin nhắn */}
                  <div className="space-y-3">
                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 text-gray-700 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Danh sách các thẻ món ăn gợi ý kiểu Mini (nếu có) */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="pt-2 pl-1 space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                          {LABELS.HERO.SUGGESTED_TITLE}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                          {msg.suggestions.map((food) => (
                            <MiniFoodCard 
                              key={food.id}
                              food={food as any}
                              onViewDetail={onViewDetail}
                            />
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
                <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain p-1 animate-spin" />
              </div>
              <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 border border-orange-50 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-400 italic">
                <div className="w-4 h-4 relative animate-spin shrink-0">
                  <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill className="object-contain" />
                </div>
                <span>{LABELS.HERO.AI_THINKING}</span>
              </div>
            </div>
          )}
        </div>

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
          className="px-6 py-4 border-t border-orange-50 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-md flex gap-3 items-center shrink-0"
        >
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={LABELS.AI_CHAT.INPUT.PLACEHOLDER}
            disabled={isLoading}
            className="flex-1 bg-gray-50 dark:bg-slate-900/50 border border-gray-150 dark:border-slate-800 hover:border-orange-200 dark:hover:border-slate-700 px-4 py-3 rounded-2xl text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            title={LABELS.AI_CHAT.FEED.SEND_MESSAGE}
            aria-label={LABELS.AI_CHAT.FEED.SEND_MESSAGE}
            className="p-3.5 rounded-2xl bg-primary text-white hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg focus:outline-none"
          >
            <Send size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}
