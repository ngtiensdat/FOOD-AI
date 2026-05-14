'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { CATEGORIES, SUGGESTED_TAGS } from '@/constants/categories';
import { Section } from '@/components/base/Section';
import { LABELS } from '@/constants/labels';

interface CategorySectionProps {
  handleCategoryClick: (category: string) => void;
  selectedCategory: string | null;
}

export const CategorySection = ({ handleCategoryClick, selectedCategory }: CategorySectionProps) => {
  return (
    <Section id="categories">
      <div className="text-center mb-12">
        <h2 className="text-h2 mb-4">{(LABELS as any).EXPLORE.TITLE}</h2>

        {/* Thanh tìm kiếm Tag */}
        <div className="max-w-xl mx-auto mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={(LABELS as any).EXPLORE.TAG_PLACEHOLDER}
            className="w-full bg-white border border-gray-200 rounded-input py-3 pl-12 pr-4 outline-none focus:border-primary shadow-sm transition-all text-body"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCategoryClick((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        {/* Gợi ý Tag */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <span className="text-small text-gray-400 font-bold mr-2 self-center">{(LABELS as any).EXPLORE.SUGGESTED_TAGS}</span>
          {SUGGESTED_TAGS.map(t => (
            <button
              key={t}
              onClick={() => handleCategoryClick(t)}
              className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold hover:bg-orange-100 hover:text-primary transition-all border border-transparent hover:border-orange-200 capitalize"
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            onClick={() => handleCategoryClick(cat.name)}
            className={`p-6 rounded-card shadow-sm border flex flex-col items-center gap-4 transition-all cursor-pointer group ${
              selectedCategory === cat.name
                ? 'bg-primary border-primary text-white shadow-xl shadow-orange-100 scale-105'
                : 'bg-white border-gray-100 hover:shadow-xl hover:border-orange-200 text-gray-800'
            }`}
          >
            <div className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</div>
            <div className={`font-bold ${selectedCategory === cat.name ? 'text-white' : 'text-gray-800'}`}>
              {cat.name}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
