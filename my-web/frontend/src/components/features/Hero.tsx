/**
 * Mục đích file này để làm gì: Component Hero (banner lớn) hiển thị ở trang chủ, chứa câu chào, thanh tìm kiếm AI và bộ lọc vị trí.
 * Các file khác hay file này có ý nghĩa như nào: Là điểm tương tác đầu tiên của người dùng, tích hợp khung kết quả AiResponseBox bên dưới.
 * Các chức năng đặc biệt: Thiết kế bắt mắt, hỗ trợ tìm kiếm bằng giọng nói/text gửi thẳng tới AI.
 */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SafeImage } from '@/components/base/SafeImage';
import { MapPin, Smile, DollarSign, Send } from 'lucide-react';
import { AiChatWindow } from './ai/AiChatWindow';
import { AiSuggestedFood } from './ai/AiResponseBox';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { LABELS } from '@/constants/labels';
import { LOCATION_DATA } from '@/constants/location.constant';

import heroBg from '../../assets/hero-bg.png';

interface HeroProps {
  aiInput: string;
  setAiInput: (val: string) => void;
  handleAiConsult: (e: React.FormEvent) => void;
  isAiLoading: boolean;
  aiResponse: string;
  suggestedFoods: AiSuggestedFood[];
  setSelectedFood: (food: FoodCardData) => void;
  isAuthenticated: boolean;
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
}

export const Hero = ({
  aiInput,
  setAiInput,
  handleAiConsult,
  isAiLoading,
  aiResponse,
  suggestedFoods,
  setSelectedFood,
  isAuthenticated,
  selectedCity,
  selectedDistrict,
  onCityChange,
  onDistrictChange,
}: HeroProps) => {
  const [isChatActive, setIsChatActive] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [localInput, setLocalInput] = useState('');

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    setInitialMessage(localInput.trim());
    setIsChatActive(true);
  };

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[600px] flex items-center">
      <Image
        src={heroBg}
        alt={LABELS.HERO.BG_ALT}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-10"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-h1 text-gray-900 mb-6 leading-tight"
        >
          {LABELS.HERO.TITLE_START} <span className="gradient-text">{LABELS.HERO.TITLE_HIGHLIGHT}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-body text-gray-700 dark:text-gray-800 mb-10 max-w-2xl mx-auto"
        >
          {LABELS.HERO.DESCRIPTION}
        </motion.p>

        {/* Khung Chatbot AI Đa bước hiển thị động */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full mb-10"
        >
          <AnimatePresence mode="wait">
            {!isChatActive ? (
              <motion.form
                key="input-bar"
                onSubmit={handleStartChat}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto flex items-center gap-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-2.5 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-350 backdrop-blur-md"
              >
                <div className="flex items-center gap-3 pl-3 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInitialMessage('');
                      setIsChatActive(true);
                    }}
                    title={LABELS.HERO.OPEN_AI_TOOLTIP}
                    className="relative w-8 h-8 rounded-xl overflow-hidden hover:scale-110 active:scale-95 transition-all flex-shrink-0 cursor-pointer border border-orange-100 dark:border-slate-800 hover:border-primary p-0.5 bg-orange-50/20"
                  >
                    <SafeImage
                      src="/logo.png"
                      alt={LABELS.COMMON.BRAND_LOGO_ALT}
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  </button>
                  <input
                    type="text"
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    placeholder={LABELS.HERO.SEARCH_PLACEHOLDER}
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-slate-100 placeholder-gray-400 font-medium focus:ring-0 focus:border-none focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!localInput.trim()}
                  className="px-6 py-3.5 bg-primary text-white font-extrabold text-xs md:text-sm rounded-2xl hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {LABELS.AI_CHAT.INPUT.SEARCH}
                  <Send size={14} />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="chat-window"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full"
              >
                <AiChatWindow
                  onViewDetail={setSelectedFood}
                  initialMessage={initialMessage}
                  onResetChat={() => {
                    setIsChatActive(false);
                    setInitialMessage('');
                    setLocalInput('');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Lựa chọn Vị trí Lọc Slider */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 max-w-md mx-auto mb-10"
        >
          <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-gray-200/50 dark:border-slate-700/50 rounded-full px-4 py-2.5 text-slate-700 dark:text-slate-200 shadow-sm w-1/2">
            <MapPin size={16} className="text-primary shrink-0 animate-bounce" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none outline-none text-small font-semibold w-full cursor-pointer text-slate-800 dark:text-slate-100"
            >
              {LOCATION_DATA.map((city) => (
                <option key={city.value} value={city.value} className="text-slate-900 bg-white">
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-gray-200/50 dark:border-slate-700/50 rounded-full px-4 py-2.5 text-slate-700 dark:text-slate-200 shadow-sm w-1/2">
            <MapPin size={16} className="text-primary shrink-0 animate-bounce" />
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="bg-transparent border-none outline-none text-small font-semibold w-full cursor-pointer text-slate-800 dark:text-slate-100"
            >
              <option value="" className="text-slate-900 bg-white">
                {LABELS.EXPLORE.ALL_DISTRICTS}
              </option>
              {LOCATION_DATA.find((c) => c.value === selectedCity)
                ?.districts.map((d) => (
                  <option key={d.value} value={d.value} className="text-slate-900 bg-white">
                    {d.label}
                  </option>
                ))}
            </select>
          </div>
        </motion.div>

        <div className="flex justify-center gap-8 mt-10 flex-wrap text-small text-gray-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <Smile size={18} className="text-orange-400" /> {LABELS.HERO.FEATURES.MOOD}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-orange-400" /> {LABELS.HERO.FEATURES.BUDGET}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-400" /> {LABELS.HERO.FEATURES.LOCATION}
          </div>
        </div>
      </div>
    </section>
  );
};
