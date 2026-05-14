'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Send, Smile, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { AiResponseBox } from './AiResponseBox';
import { LABELS } from '@/constants/labels';

import heroBg from '../../assets/hero-bg.png';

interface HeroProps {
  aiInput: string;
  setAiInput: (val: string) => void;
  handleAiConsult: (e: React.FormEvent) => void;
  isAiLoading: boolean;
  aiResponse: string;
  suggestedFoods: any[];
  setSelectedFood: (food: any) => void;
  isAuthenticated: boolean;
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
}: HeroProps) => {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[600px] flex items-center">
      <Image 
        src={heroBg}
        alt="Hero Background"
        fill
        priority
        className="object-cover opacity-10"
      />
      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-h1 mb-6 leading-tight"
        >
          {LABELS.HERO.TITLE_START} <span className="gradient-text">{LABELS.HERO.TITLE_HIGHLIGHT}</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-body text-gray-600 mb-10 max-w-2xl mx-auto"
        >
          {LABELS.HERO.DESCRIPTION}
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleAiConsult}
          className="glass p-3 rounded-card shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto items-center"
        >
          <div className="flex items-center gap-3 px-4 w-full">
            <Sparkles className="text-primary shrink-0" size={24} />
            <input
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

        <AiResponseBox 
          isLoading={isAiLoading}
          response={aiResponse}
          suggestedFoods={suggestedFoods}
          onViewDetail={setSelectedFood}
        />

        <div className="flex justify-center gap-8 mt-10 flex-wrap text-small text-gray-500 font-medium">
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
