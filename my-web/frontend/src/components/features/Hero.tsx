/**
 * Mục đích file này để làm gì: Component Hero (banner lớn) hiển thị ở trang chủ, chứa câu chào, thanh tìm kiếm AI và bộ lọc vị trí.
 * Các file khác hay file này có ý nghĩa như nào: Là điểm tương tác đầu tiên của người dùng, tích hợp khung kết quả AiResponseBox bên dưới.
 * Các chức năng đặc biệt: Thiết kế bắt mắt, hỗ trợ tìm kiếm bằng giọng nói/text gửi thẳng tới AI.
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Send, Smile, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { AiResponseBox, AiSuggestedFood } from './ai/AiResponseBox';
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
  setSelectedFood: (food: AiSuggestedFood) => void;
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
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[600px] flex items-center">
      <Image 
        src={heroBg}
        alt="Hero Background"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-10"
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

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleAiConsult}
          className="glass p-3 rounded-card shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto items-center animate-glow"
        >
          <div className="flex items-center gap-3 px-4 w-full">
            <Sparkles className="text-primary shrink-0" size={24} />
            <input
              suppressHydrationWarning
              type="text"
              className="w-full bg-transparent border-none outline-none text-body py-2"
              placeholder={isAuthenticated ? LABELS.HERO.PLACEHOLDER_AUTH : LABELS.HERO.PLACEHOLDER_GUEST}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full md:w-auto rounded-full px-8 py-4">
            <Send size={20} className="mr-2" />
            <span>{LABELS.HERO.SEARCH_BUTTON}</span>
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 mt-4 max-w-md mx-auto"
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

        <AiResponseBox 
          isLoading={isAiLoading}
          response={aiResponse}
          suggestedFoods={suggestedFoods}
          onViewDetail={setSelectedFood}
        />

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
