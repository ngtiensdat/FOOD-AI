// Mục đích file này để làm gì: Component Modal Cài đặt gợi ý AI đa chức năng (bố cục sidebar + content).
// Các file khác hay file này có ý nghĩa như nào: Được hiển thị từ AiChatWindow khi bấm nút bánh răng cài đặt trên ChatSidebar.
// Các chức năng đặc biệt: Giao diện đa tab (Chung, Cá nhân hóa, Kiểm soát dữ liệu, Tài khoản), hỗ trợ đổi giao diện thực tế (Theme) qua useTheme, đổi ngôn ngữ, xem danh sách Thích/Ghét món ăn gợi ý, xóa toàn bộ phản hồi.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Modal Component, Tab Control Pattern.
// Các biến, hàm đặc biệt trong file: PreferenceSettingsModal component.
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Trash2,
  Loader2,
  EyeOff,
  Sparkles,
  Settings,
  SlidersHorizontal,
  User,
  Globe,
  Volume2,
} from 'lucide-react';
import { aiService } from '@/services/ai.service';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import SafeImage from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';

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

interface PreferenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId: number | null;
}

type SettingsTab = 'general' | 'personalization' | 'data_control' | 'account';

export function PreferenceSettingsModal({
  isOpen,
  onClose,
  activeConversationId,
}: PreferenceSettingsModalProps) {
  const { user } = useAuth();
  
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [activeSubTab, setActiveSubTab] = useState<'like' | 'dislike'>('like');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [clearingFeedbacks, setClearingFeedbacks] = useState(false);

  // General settings state
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<'auto' | 'vi' | 'en'>('auto');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const list = await aiService.getFeedbackList();
      setFeedbacks(list || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách phản hồi:', err);
      toast.error(LABELS.AI_CHAT.PREFERENCES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeedbacks();
    }
  }, [isOpen]);

  const handleRemoveFeedback = async (item: FeedbackItem) => {
    setRemovingId(item.foodId);
    try {
      // Toggle off by calling with same type
      const res = await aiService.submitFeedback(
        activeConversationId,
        item.foodId,
        item.feedbackType
      );
      if (res) {
        setFeedbacks((prev) => prev.filter((f) => f.foodId !== item.foodId));
        toast.success(
          item.feedbackType === 'LIKE'
            ? LABELS.AI_CHAT.PREFERENCES.REMOVE_LIKE_SUCCESS
            : LABELS.AI_CHAT.PREFERENCES.REMOVE_DISLIKE_SUCCESS
        );
      }
    } catch (err) {
      console.error('Lỗi khi gỡ phản hồi:', err);
      toast.error(LABELS.AI_CHAT.PREFERENCES.REMOVE_ERROR);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAllFeedbacks = async () => {
    if (window.confirm(LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_CONFIRM)) {
      setClearingFeedbacks(true);
      try {
        const res = await aiService.clearAllFeedback();
        if (res) {
          setFeedbacks([]);
          toast.success(LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_SUCCESS);
        }
      } catch (err) {
        console.error('Lỗi khi xóa tất cả phản hồi:', err);
        toast.error(LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_ERROR);
      } finally {
        setClearingFeedbacks(null as any);
      }
    }
  };

  if (!isOpen) return null;

  const likedItems = feedbacks.filter((f) => f.feedbackType === 'LIKE');
  const dislikedItems = feedbacks.filter((f) => f.feedbackType === 'DISLIKE');
  const currentItems = activeSubTab === 'like' ? likedItems : dislikedItems;

  const tabsConfig = [
    { id: 'general' as SettingsTab, label: LABELS.AI_CHAT.PREFERENCES.TAB_GENERAL, icon: Settings },
    { id: 'personalization' as SettingsTab, label: LABELS.AI_CHAT.PREFERENCES.TAB_PERSONALIZATION, icon: Heart },
    { id: 'data_control' as SettingsTab, label: LABELS.AI_CHAT.PREFERENCES.TAB_DATA_CONTROL, icon: SlidersHorizontal },
    { id: 'account' as SettingsTab, label: LABELS.AI_CHAT.PREFERENCES.TAB_ACCOUNT, icon: User },
  ];

  return (
    <AnimatePresence>
      <div className="modal-wrapper">
        {/* Overlay */}
        <motion.div
          id="preference-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="modal-overlay"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-card max-w-3xl w-full h-[85vh] max-h-[580px] flex flex-col !p-0 overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-orange-50 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Sparkles size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                {LABELS.AI_CHAT.PREFERENCES.TITLE}
              </h3>
            </div>
            <button
              id="preference-modal-close-button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Split View */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
            
            {/* Sidebar Trái */}
            <div className="w-56 shrink-0 border-r border-orange-50 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 space-y-1">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`preference-modal-sidebar-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-orange-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-orange-500' : 'text-slate-400'} />
                    {tab.label}
                    {isSelected && (
                      <motion.div
                        layoutId="activeTabSidebarBar"
                        className="absolute left-0 top-2 bottom-2 w-1 bg-orange-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Vùng Content Phải */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white dark:bg-slate-950 min-w-0">
              
              {/* TAB CHUNG */}
              {activeTab === 'general' && (
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
                        onChange={(e) => setTheme(e.target.value as any)}
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
                        onChange={(e) => setLang(e.target.value as any)}
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
                        <input
                          id="preference-modal-voice-toggle"
                          type="checkbox"
                          checked={voiceEnabled}
                          onChange={(e) => setVoiceEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB CÁ NHÂN HÓA */}
              {activeTab === 'personalization' && (
                <div className="flex flex-col h-full min-h-0">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 shrink-0">
                    {LABELS.AI_CHAT.PREFERENCES.TAB_PERSONALIZATION}
                  </h4>

                  {/* Subtab Thích / Ghét */}
                  <div className="flex gap-4 border-b border-orange-50/50 dark:border-slate-800/60 mb-4 shrink-0">
                    <button
                      id="preference-modal-tab-like"
                      onClick={() => setActiveSubTab('like')}
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
                    </button>
                    <button
                      id="preference-modal-tab-dislike"
                      onClick={() => setActiveSubTab('dislike')}
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
                    </button>
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
                            <button
                              id={`preference-modal-remove-button-${item.foodId}`}
                              onClick={() => handleRemoveFeedback(item)}
                              disabled={removingId === item.foodId}
                              title={LABELS.AI_CHAT.PREFERENCES.TOOLTIP_REMOVE}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                            >
                              {removingId === item.foodId ? (
                                <Loader2 size={12} className="animate-spin text-red-500" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB KIỂM SOÁT DỮ LIỆU */}
              {activeTab === 'data_control' && (
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
                      
                      <button
                        id="preference-modal-clear-all-btn"
                        onClick={handleClearAllFeedbacks}
                        disabled={clearingFeedbacks}
                        className="px-4 py-2 text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {clearingFeedbacks ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        {LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_BTN}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB TÀI KHOẢN */}
              {activeTab === 'account' && (
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
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
