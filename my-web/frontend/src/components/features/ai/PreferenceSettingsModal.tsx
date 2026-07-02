// Mục đích file này để làm gì: Component Modal Cài đặt gợi ý AI đa chức năng (bố cục sidebar + content).
// Các file khác hay file này có ý nghĩa như nào: Được hiển thị từ AiChatWindow khi bấm nút bánh răng cài đặt trên ChatSidebar.
// Các chức năng đặc biệt: Giao diện đa tab (Chung, Cá nhân hóa, Kiểm soát dữ liệu, Tài khoản), hỗ trợ đổi giao diện thực tế (Theme) qua useTheme, đổi ngôn ngữ, xem danh sách Thích/Ghét món ăn gợi ý, xóa toàn bộ phản hồi.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Modal Component, Tab Control Pattern.
// Các biến, hàm đặc biệt trong file: PreferenceSettingsModal component.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { GeneralTab } from './preference-settings/GeneralTab';
import { PersonalizationTab } from './preference-settings/PersonalizationTab';
import { DataControlTab } from './preference-settings/DataControlTab';
import { AccountTab } from './preference-settings/AccountTab';

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
  
  const [isMounted, setIsMounted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [activeSubTab, setActiveSubTab] = useState<'like' | 'dislike'>('like');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [clearingFeedbacks, setClearingFeedbacks] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // General settings state
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<'auto' | 'vi' | 'en'>('auto');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showConfirmLang, setShowConfirmLang] = useState(false);
  const [pendingLang, setPendingLang] = useState<'auto' | 'vi' | 'en'>('auto');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as 'vi' | 'en' | null;
      if (savedLang) {
        setLang(savedLang);
      } else {
        setLang('vi');
      }
    }
  }, []);

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
    setShowConfirmClear(true);
  };

  const executeClearAllFeedbacks = async () => {
    setShowConfirmClear(false);
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
      setClearingFeedbacks(false);
    }
  };

  // Declare hooks first (always executed, never conditional)
  const likedItems = useMemo(() => feedbacks.filter((f) => f.feedbackType === 'LIKE'), [feedbacks]);
  const dislikedItems = useMemo(() => feedbacks.filter((f) => f.feedbackType === 'DISLIKE'), [feedbacks]);
  const currentItems = useMemo(() => (activeSubTab === 'like' ? likedItems : dislikedItems), [activeSubTab, likedItems, dislikedItems]);

  // Early return statement (placed after React hooks)
  if (!isMounted || !isOpen) return null;
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
            <Button
              id="preference-modal-close-button"
              onClick={onClose}
              variant="none"
              size="none"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Body Split View */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
            
            {/* Sidebar Trái */}
            <div className="w-56 shrink-0 border-r border-orange-50 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 space-y-1">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    id={`preference-modal-sidebar-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    variant="none"
                    size="none"
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
                  </Button>
                );
              })}
            </div>

            {/* Vùng Content Phải */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white dark:bg-slate-950 min-w-0">
              
              {activeTab === 'general' && (
                <GeneralTab
                  theme={theme}
                  setTheme={setTheme}
                  lang={lang}
                  onChangeLang={(selected) => {
                    setPendingLang(selected);
                    setShowConfirmLang(true);
                  }}
                  voiceEnabled={voiceEnabled}
                  setVoiceEnabled={setVoiceEnabled}
                />
              )}

              {activeTab === 'personalization' && (
                <PersonalizationTab
                  loading={loading}
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  likedItems={likedItems}
                  dislikedItems={dislikedItems}
                  currentItems={currentItems}
                  removingId={removingId}
                  onRemoveFeedback={handleRemoveFeedback}
                />
              )}

              {activeTab === 'data_control' && (
                <DataControlTab
                  clearingFeedbacks={clearingFeedbacks}
                  onClearAllFeedbacks={handleClearAllFeedbacks}
                />
              )}

              {activeTab === 'account' && (
                <AccountTab
                  user={user}
                />
              )}

            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showConfirmLang}
        title={LABELS.SETTINGS.LANGUAGE_CONFIRM_TITLE}
        message={LABELS.SETTINGS.LANGUAGE_CONFIRM_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="warning"
        onConfirm={() => {
          setLang(pendingLang);
          if (pendingLang === 'auto') {
            localStorage.removeItem('lang');
            document.cookie = "lang=; path=/; max-age=0";
          } else {
            localStorage.setItem('lang', pendingLang);
            document.cookie = `lang=${pendingLang}; path=/; max-age=31536000; SameSite=Lax`;
          }
          window.location.reload();
        }}
        onCancel={() => {
          setShowConfirmLang(false);
        }}
      />

      <ConfirmModal
        isOpen={showConfirmClear}
        title={LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_CONFIRM}
        message={LABELS.AI_CHAT.PREFERENCES.DELETE_FEEDBACKS_CONFIRM}
        confirmText={LABELS.COMMON.DELETE || 'Xóa'}
        cancelText={LABELS.COMMON.CANCEL}
        variant="danger"
        onConfirm={executeClearAllFeedbacks}
        onCancel={() => {
          setShowConfirmClear(false);
        }}
      />
    </AnimatePresence>
  );
}
