/**
 * Mục đích file này để làm gì: Component hiển thị phần "Khám phá theo danh mục" trên trang chủ/explore.
 * Các file khác hay file này có ý nghĩa như nào: Liệt kê các thẻ Category và các gợi ý Tags cho người dùng bấm vào.
 * Các chức năng đặc biệt: Giao diện thẻ trực quan có hiệu ứng hover, tích hợp sẵn các hằng số CATEGORIES và SUGGESTED_TAGS cục bộ.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { Section } from '@/components/base/Section';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

const CATEGORIES = [
  { name: LABELS.CATEGORIES.NAMES.WATER, icon: '/categories/water_category_3d.png' },
  { name: LABELS.CATEGORIES.NAMES.RICE, icon: '/categories/rice_category_3d.png' },
  { name: LABELS.CATEGORIES.NAMES.SNACK, icon: '/categories/snack_category_3d.png' },
  { name: LABELS.CATEGORIES.NAMES.DESSERT, icon: '/categories/dessert_category_3d.png' },
  { name: LABELS.CATEGORIES.NAMES.CASUAL, icon: '/categories/casual_category_3d.png' },
  { name: LABELS.CATEGORIES.NAMES.LUXURY, icon: '/categories/luxury_category_3d.png' },
];

const SUGGESTED_TAGS = [
  LABELS.CATEGORIES.TAGS.TRADITIONAL,
  LABELS.CATEGORIES.TAGS.FASTFOOD,
  LABELS.CATEGORIES.TAGS.FRIED,
  LABELS.CATEGORIES.TAGS.ALONE,
  LABELS.CATEGORIES.TAGS.GROUP,
  LABELS.CATEGORIES.TAGS.OFFICE,
  LABELS.CATEGORIES.TAGS.SPICY,
  LABELS.CATEGORIES.TAGS.HEALTHY,
];

interface CategorySectionProps {
  handleCategoryClick: (category: string) => void;
  selectedCategory: string | null;
}

export const CategorySection = ({ handleCategoryClick, selectedCategory }: CategorySectionProps) => {
  return (
    <Section id="categories">
      <div className="text-center mb-6">
        <h2 className="text-h2 text-gray-900 mb-4">{LABELS.EXPLORE.TITLE}</h2>

        {/* Thanh tìm kiếm Tag */}
        <div className="max-w-xl mx-auto mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <Input
            variant="none"
            suppressHydrationWarning
            type="text"
            placeholder={LABELS.EXPLORE.TAG_PLACEHOLDER}
            className="form-input rounded-input py-3 pl-12 pr-4 shadow-sm text-body"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCategoryClick((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        {/* Gợi ý Tag */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-small text-gray-400 dark:text-gray-400 font-bold mr-2 self-center">{LABELS.EXPLORE.SUGGESTED_TAGS}</span>
          {SUGGESTED_TAGS.map(t => (
            <Button
              suppressHydrationWarning
              key={t}
              onClick={() => handleCategoryClick(t)}
              variant="none"
              size="none"
              className="px-4 py-1.5 bg-gray-100 dark:bg-gray-200 text-gray-600 dark:text-gray-900 rounded-full text-xs font-bold hover:bg-orange-100 hover:text-primary transition-all border border-transparent hover:border-orange-200 capitalize"
            >
              #{t}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            onClick={() => handleCategoryClick(cat.name)}
            className={`p-6 flex flex-col items-center gap-4 cursor-pointer group card-premium ${selectedCategory === cat.name
                ? '!bg-primary !border-primary text-white shadow-xl scale-105'
                : 'hover:border-orange-200 text-gray-900'
              }`}
          >
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform p-2 overflow-hidden">
              <Image
                src={cat.icon}
                alt={cat.name}
                width={72}
                height={72}
                className="object-contain"
                priority
              />
            </div>
            <div className={`font-bold ${selectedCategory === cat.name ? 'text-white' : 'text-gray-900'}`}>
              {cat.name}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
