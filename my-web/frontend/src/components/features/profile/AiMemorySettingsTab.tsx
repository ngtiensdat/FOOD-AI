'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Trash2,
  AlertOctagon,
  ShieldAlert,
  ThumbsDown,
  Heart,
  Info,
  Sparkles,
  Lock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { aiService } from '@/services/ai.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { Button } from '@/components/base/Button';
import SafeImage from '@/components/base/SafeImage';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';

interface AiMemoryData {
  preferences: {
    allergies: string[];
    dislikes: string[];
    persona: string | null;
    specialNotes: string | null;
    cuisine: string | null;
  };
  likedFoods: Array<{
    id: number;
    foodId: number;
    name: string;
    price: number;
    image: string | null;
  }>;
  dislikedFoods: Array<{
    id: number;
    foodId: number;
    name: string;
    price: number;
    image: string | null;
  }>;
}

const PERSONA_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  GYM: {
    label: 'Người tập thể hình / Thể thao (GYM)',
    icon: '🏋️',
    desc: 'Ưu tiên món giàu đạm (Protein), nạc, ít dầu mỡ, tư vấn dinh dưỡng tăng cơ.',
  },
  PREGNANT: {
    label: 'Phụ nữ mang thai / Dưỡng thai (PREGNANT)',
    icon: '🤰',
    desc: 'Bắt buộc ăn chín uống sôi, cấm đồ tái sống, ưu tiên món hầm bổ dưỡng.',
  },
  VEGAN: {
    label: 'Người ăn chay trường (VEGAN)',
    icon: '🌱',
    desc: 'Tuyệt đối không chứa thịt động vật/hải sản, ưu tiên rau củ, nấm, đậu hũ.',
  },
  STUDENT: {
    label: 'Học sinh / Sinh viên (STUDENT)',
    icon: '🎓',
    desc: 'Ưu tiên các suất ăn no, đầy đặn và mức giá tiết kiệm sinh viên.',
  },
  WEIGHT_LOSS: {
    label: 'Giảm cân / Eat clean (WEIGHT_LOSS)',
    icon: '🥗',
    desc: 'Hạn chế tinh bột nhanh và dầu mỡ, ưu tiên salad và đồ luộc/hấp.',
  },
  WELLNESS: {
    label: 'Người cần hồi phục / Thanh đạm (WELLNESS)',
    icon: '🍵',
    desc: 'Món ăn mềm, ấm, dễ tiêu hóa như cháo nóng, súp bổ dưỡng.',
  },
  OFFICE: {
    label: 'Dân văn phòng (OFFICE)',
    icon: '💼',
    desc: 'Suất cơm trưa nhanh gọn, sạch sẽ, tiện mang đi, hạn chế mùi nồng.',
  },
};

const ALLERGY_DETAILS: Record<string, { label: string; crossReaction: string }> = {
  peanuts: {
    label: 'Đậu phộng (Lạc)',
    crossReaction: 'Tránh: bơ đậu phộng, kẹo lạc, dầu phộng',
  },
  seafood: {
    label: 'Hải sản (Đồ biển)',
    crossReaction: 'Dị ứng chéo: tôm, cua, bề bề, mực, sò, cá biển',
  },
  dairy: {
    label: 'Sữa & Bơ sữa',
    crossReaction: 'Tránh: phô mai, bơ, sữa chua, kem tươi, sốt kem',
  },
  shellfish: {
    label: 'Hải sản có vỏ (Giáp xác & Thân mềm)',
    crossReaction: 'Tránh: tôm, bề bề, tôm tít, cua, ghẹ, sò, ốc, mực',
  },
  gluten: {
    label: 'Gluten (Lúa mì & Bột mì)',
    crossReaction: 'Tránh: bánh mì, mì sợi lúa mì, bánh nướng',
  },
  eggs: {
    label: 'Trứng & Chế phẩm',
    crossReaction: 'Tránh: trứng gà, vịt, cút, mayonnaise, trứng muối',
  },
  soy: {
    label: 'Đậu nành & Chế phẩm',
    crossReaction: 'Tránh: đậu hũ, nước tương, chao, sữa đậu nành',
  },
  wheat: {
    label: 'Lúa mì',
    crossReaction: 'Tránh: bánh mì, bột mì, bánh ngọt',
  },
};

const normalizePreferenceList = (list: unknown): string[] => {
  if (!list) return [];
  if (Array.isArray(list)) {
    if (
      list.length > 1 &&
      list.every((item) => typeof item === 'string' && item.length === 1)
    ) {
      return [list.join('')];
    }
    return list
      .map((item) => String(item).trim())
      .filter((item) => item && item.toLowerCase() !== 'none');
  }
  if (typeof list === 'string' && list.trim() && list.toLowerCase() !== 'none') {
    return [list.trim()];
  }
  return [];
};

const parseAllergyDisplay = (allergy: string): { label: string; crossReaction?: string } => {
  const lower = allergy.toLowerCase().trim();

  if (ALLERGY_DETAILS[lower]) {
    return ALLERGY_DETAILS[lower];
  }

  if (
    lower.includes('tôm') ||
    lower.includes('giáp xác') ||
    lower.includes('shrimp') ||
    lower.includes('prawn') ||
    lower.includes('bề bề')
  ) {
    return {
      label: 'Tôm & Động vật giáp xác',
      crossReaction: 'Dị ứng chéo: Bề bề (tôm tít), tép, cua, ghẹ, mắm tôm',
    };
  }

  if (
    lower.includes('hải sản') ||
    lower.includes('seafood') ||
    lower.includes('đồ biển')
  ) {
    return {
      label: 'Hải sản tổng hợp',
      crossReaction: 'Dị ứng chéo: Tôm, cua, bề bề, mực, sò, cá biển, mắm tôm',
    };
  }

  if (
    lower.includes('lạc') ||
    lower.includes('đậu phộng') ||
    lower.includes('peanuts')
  ) {
    return {
      label: 'Đậu phộng (Lạc)',
      crossReaction: 'Tránh: Bơ đậu phộng, kẹo lạc, dầu phộng',
    };
  }

  if (
    lower.includes('sữa') ||
    lower.includes('dairy') ||
    lower.includes('milk')
  ) {
    return {
      label: 'Sữa & Chế phẩm bơ sữa',
      crossReaction: 'Tránh: Phô mai, bơ, sữa chua, kem béo',
    };
  }

  if (lower.includes('trứng') || lower.includes('egg')) {
    return {
      label: 'Trứng & Chế phẩm',
      crossReaction: 'Tránh: Trứng gà, vịt, cút, mayonnaise',
    };
  }

  if (lower.includes('gluten') || lower.includes('bột mì') || lower.includes('lúa mì')) {
    return {
      label: 'Gluten (Lúa mì / Bột mì)',
      crossReaction: 'Tránh: Bánh mì, mì sợi lúa mì',
    };
  }

  if (lower.includes('đậu nành') || lower.includes('soy')) {
    return {
      label: 'Đậu nành & Chế phẩm',
      crossReaction: 'Tránh: Đậu hũ, nước tương, chao',
    };
  }

  return {
    label: allergy,
  };
};

export const AiMemorySettingsTab = () => {
  const [data, setData] = useState<AiMemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiService.getAiMemory();
      setData(res);
    } catch {
      toast.error('Không thể tải bộ nhớ AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    aiService.getAiMemory().then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteItem = async (
    type: 'allergy' | 'dislike' | 'persona' | 'specialNotes' | 'cuisine' | 'feedback',
    value?: string | number,
    keyIdentifier?: string,
  ) => {
    const key = keyIdentifier || `${type}-${value}`;
    setDeletingKey(key);
    try {
      const res = await aiService.deleteAiMemoryItem(type, value);
      if (res) {
        toast.success(LABELS.SETTINGS.AI_MEMORY.TOAST_DELETE_SUCCESS);
        if (data) {
          if (type === 'allergy' && typeof value === 'string') {
            setData({
              ...data,
              preferences: {
                ...data.preferences,
                allergies: data.preferences.allergies.filter(
                  (a) => a.toLowerCase() !== value.toLowerCase(),
                ),
              },
            });
          } else if (type === 'dislike' && typeof value === 'string') {
            setData({
              ...data,
              preferences: {
                ...data.preferences,
                dislikes: data.preferences.dislikes.filter(
                  (d) => d.toLowerCase() !== value.toLowerCase(),
                ),
              },
            });
          } else if (type === 'persona') {
            setData({
              ...data,
              preferences: { ...data.preferences, persona: null },
            });
          } else if (type === 'specialNotes') {
            setData({
              ...data,
              preferences: { ...data.preferences, specialNotes: null },
            });
          } else if (type === 'cuisine') {
            setData({
              ...data,
              preferences: { ...data.preferences, cuisine: null },
            });
          } else if (type === 'feedback' && value) {
            const fId = Number(value);
            setData({
              ...data,
              likedFoods: data.likedFoods.filter((f) => f.id !== fId),
              dislikedFoods: data.dislikedFoods.filter((f) => f.id !== fId),
            });
          }
        }
      }
    } catch {
      toast.error('Xóa mục thất bại. Vui lòng thử lại.');
    } finally {
      setDeletingKey(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await aiService.clearAiMemory();
      toast.success(LABELS.SETTINGS.AI_MEMORY.TOAST_CLEAR_SUCCESS);
      setShowClearConfirm(false);
      setData({
        preferences: {
          allergies: [],
          dislikes: [],
          persona: null,
          specialNotes: null,
          cuisine: null,
        },
        likedFoods: [],
        dislikedFoods: [],
      });
    } catch {
      toast.error('Không thể xóa toàn bộ bộ nhớ. Vui lòng thử lại.');
    } finally {
      setIsClearingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
          Đang truy xuất bộ nhớ học sâu của AI...
        </p>
      </div>
    );
  }

  const rawPrefs = data?.preferences;
  const prefs = {
    allergies: normalizePreferenceList(rawPrefs?.allergies),
    dislikes: normalizePreferenceList(rawPrefs?.dislikes),
    persona: rawPrefs?.persona || null,
    specialNotes: rawPrefs?.specialNotes || null,
    cuisine: rawPrefs?.cuisine || null,
  };

  const hasAnyData =
    prefs.allergies.length > 0 ||
    prefs.dislikes.length > 0 ||
    Boolean(prefs.persona) ||
    Boolean(prefs.specialNotes) ||
    Boolean(prefs.cuisine) ||
    (data?.likedFoods?.length || 0) > 0 ||
    (data?.dislikedFoods?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl shadow-md">
              <Brain size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {LABELS.SETTINGS.AI_MEMORY.TITLE}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {LABELS.SETTINGS.AI_MEMORY.SUBTITLE}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMemory}
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
          >
            <RefreshCw size={14} />
            Làm mới
          </Button>

          {hasAnyData && (
            <Button
              variant="none"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 px-3 py-1.5 rounded-xl transition-all"
            >
              <Trash2 size={14} />
              {LABELS.SETTINGS.AI_MEMORY.CLEAR_ALL_BTN}
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Informational Alert Banner: Explain Autonomous Learning & Read-Only / Delete-Only Policy */}
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex gap-3 text-xs leading-relaxed">
        <Info size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <span>{LABELS.SETTINGS.AI_MEMORY.NOTICE_TITLE}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold">
              <Lock size={10} /> Chỉ xem & Xóa bỏ
            </span>
          </div>
          <p className="text-amber-750 dark:text-amber-300/90">
            {LABELS.SETTINGS.AI_MEMORY.NOTICE_DESC}
          </p>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="py-14 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl">
            🧠
          </div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            Bộ nhớ AI đang trống
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            Khi bạn trò chuyện với Trợ lý AI (như nói về món kiêng, dị ứng, tập gym hay mang thai), hệ thống sẽ tự động đúc kết và hiển thị ở đây để bạn theo dõi.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Dị ứng thực phẩm (Bắt buộc tránh tuyệt đối) */}
          <section className="p-5 rounded-2xl border border-red-100 dark:border-red-950/40 bg-gradient-to-b from-red-50/20 to-transparent dark:from-red-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <AlertOctagon size={18} />
                <span>{LABELS.SETTINGS.AI_MEMORY.SECTIONS.ALLERGIES}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                  {prefs.allergies.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              {LABELS.SETTINGS.AI_MEMORY.SECTIONS.ALLERGIES_DESC}
            </p>

            {prefs.allergies.length === 0 ? (
              <p className="text-xs italic text-gray-400 dark:text-slate-500 py-1">
                {LABELS.SETTINGS.AI_MEMORY.EMPTY_ALLERGIES}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                <AnimatePresence>
                  {prefs.allergies.map((allergy) => {
                    const isDeleting = deletingKey === `allergy-${allergy}`;
                    const info = parseAllergyDisplay(allergy);
                    return (
                      <motion.div
                        key={allergy}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 rounded-xl bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs border border-red-200/80 dark:border-red-800/60 shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>🚫 {info.label}</span>
                        </div>
                        {info.crossReaction && (
                          <span className="text-[10px] font-semibold text-red-600/90 dark:text-red-300/80 bg-red-200/60 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                            {info.crossReaction}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('allergy', allergy)}
                          disabled={isDeleting}
                          title={`Xóa "${info.label}" khỏi danh sách dị ứng`}
                          className="hover:bg-red-200 dark:hover:bg-red-800 p-0.5 rounded-md transition-colors text-red-600 dark:text-red-400 self-end sm:self-center ml-auto sm:ml-1"
                        >
                          {isDeleting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span className="font-bold text-xs leading-none">✕</span>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* 2. Khẩu vị kiêng / Không thích (Dislikes) */}
          <section className="p-5 rounded-2xl border border-amber-100 dark:border-amber-950/40 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <ShieldAlert size={18} />
                <span>{LABELS.SETTINGS.AI_MEMORY.SECTIONS.DISLIKES}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                  {prefs.dislikes.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              {LABELS.SETTINGS.AI_MEMORY.SECTIONS.DISLIKES_DESC}
            </p>

            {prefs.dislikes.length === 0 ? (
              <p className="text-xs italic text-gray-400 dark:text-slate-500 py-1">
                {LABELS.SETTINGS.AI_MEMORY.EMPTY_DISLIKES}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                <AnimatePresence>
                  {prefs.dislikes.map((dislike) => {
                    const isDeleting = deletingKey === `dislike-${dislike}`;
                    return (
                      <motion.div
                        key={dislike}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800/60 shadow-sm"
                      >
                        <span>⚡ Không thích {dislike}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('dislike', dislike)}
                          disabled={isDeleting}
                          title={`Xóa món "${dislike}" khỏi danh sách kiêng`}
                          className="hover:bg-amber-200 dark:hover:bg-amber-800 p-0.5 rounded-md transition-colors text-amber-700 dark:text-amber-400"
                        >
                          {isDeleting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span className="font-bold text-xs leading-none">✕</span>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* 3. Đối tượng & Phong cách ẩm thực (Persona) */}
          <section className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/40 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <Sparkles size={18} />
                <span>{LABELS.SETTINGS.AI_MEMORY.SECTIONS.PERSONA}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              {LABELS.SETTINGS.AI_MEMORY.SECTIONS.PERSONA_DESC}
            </p>

            {!prefs.persona ? (
              <p className="text-xs italic text-gray-400 dark:text-slate-500 py-1">
                {LABELS.SETTINGS.AI_MEMORY.EMPTY_PERSONA}
              </p>
            ) : (
              <div className="pt-1">
                {(() => {
                  const personaInfo = PERSONA_LABELS[prefs.persona] || {
                    label: `Phong cách: ${prefs.persona}`,
                    icon: '🎯',
                    desc: 'Được AI nhận diện theo thói quen ăn uống của bạn.',
                  };
                  const isDeleting = deletingKey === 'persona';
                  return (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-sm flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{personaInfo.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                            {personaInfo.label}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                            {personaInfo.desc}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="none"
                        size="sm"
                        onClick={() => handleDeleteItem('persona', undefined, 'persona')}
                        disabled={isDeleting}
                        className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 font-semibold transition-all"
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Xóa phong cách
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>

          {/* 4. Ghi chú & Thể trạng đặc biệt (Special Notes) */}
          <section className="p-5 rounded-2xl border border-teal-100 dark:border-teal-950/40 bg-gradient-to-b from-teal-50/20 to-transparent dark:from-teal-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                <Info size={18} />
                <span>{LABELS.SETTINGS.AI_MEMORY.SECTIONS.SPECIAL_NOTES}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              {LABELS.SETTINGS.AI_MEMORY.SECTIONS.SPECIAL_NOTES_DESC}
            </p>

            {!prefs.specialNotes ? (
              <p className="text-xs italic text-gray-400 dark:text-slate-500 py-1">
                {LABELS.SETTINGS.AI_MEMORY.EMPTY_NOTES}
              </p>
            ) : (
              <div className="pt-1">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/60 shadow-sm flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    &ldquo;{prefs.specialNotes}&rdquo;
                  </p>
                  <Button
                    variant="none"
                    size="sm"
                    onClick={() => handleDeleteItem('specialNotes', undefined, 'specialNotes')}
                    disabled={deletingKey === 'specialNotes'}
                    className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 transition-all"
                  >
                    {deletingKey === 'specialNotes' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Xóa
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* 5. Món ăn đã thích & Món đã bỏ qua từ gợi ý AI */}
          {((data?.likedFoods?.length || 0) > 0 || (data?.dislikedFoods?.length || 0) > 0) && (
            <section className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span>🍽️ Món ăn đã học qua phản hồi AI</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Liked Foods */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Heart size={14} className="fill-emerald-500 text-emerald-500" />
                    <span>Đã thích ({data?.likedFoods?.length || 0})</span>
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data?.likedFoods.map((f) => {
                      const isDeleting = deletingKey === `feedback-${f.id}`;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
                              <SafeImage
                                src={getValidImageUrl(f.image)}
                                alt={f.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                {f.name}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                {formatCurrency(f.price)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('feedback', f.id, `feedback-${f.id}`)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            title="Xóa khỏi danh sách đã thích"
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Disliked Foods */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ThumbsDown size={14} />
                    <span>Đã bỏ qua ({data?.dislikedFoods?.length || 0})</span>
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data?.dislikedFoods.map((f) => {
                      const isDeleting = deletingKey === `feedback-${f.id}`;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
                              <SafeImage
                                src={getValidImageUrl(f.image)}
                                alt={f.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                {f.name}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                {formatCurrency(f.price)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('feedback', f.id, `feedback-${f.id}`)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            title="Xóa khỏi danh sách đã bỏ qua"
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Confirm Clear All Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title={LABELS.SETTINGS.AI_MEMORY.CLEAR_CONFIRM_TITLE}
        message={LABELS.SETTINGS.AI_MEMORY.CLEAR_CONFIRM_DESC}
        confirmText={
          isClearingAll ? 'Đang xóa...' : LABELS.SETTINGS.AI_MEMORY.CLEAR_ALL_BTN
        }
        cancelText={LABELS.COMMON.CANCEL}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
        variant="danger"
      />
    </div>
  );
};
