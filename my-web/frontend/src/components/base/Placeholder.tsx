'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface PlaceholderProps {
  title?: string;
  description?: string;
  icon?: string;
  onBack?: () => void;
  backText?: string;
}

export const Placeholder = ({ 
  title = "Tính năng đang phát triển", 
  description = "Chúng tôi đang phát triển tính năng này. Quay lại sau nhé! ✨", 
  icon = "🚧",
  onBack,
  backText = "Quay lại trang chủ"
}: PlaceholderProps) => {
  return (
    <div className="pt-40 pb-40 px-6 max-w-4xl mx-auto text-center min-h-[60vh] flex flex-col justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="glass p-12 rounded-3xl border border-orange-100 shadow-xl max-w-lg"
      >
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-primary mx-auto mb-6 text-3xl">
          {icon}
        </div>
        <h2 className="text-h2 mb-4 text-gray-800">{title}</h2>
        <p className="text-body text-gray-500 mb-8 leading-relaxed">{description}</p>
        {onBack && (
          <Button onClick={onBack} className="rounded-full px-8 py-3.5">
            {backText}
          </Button>
        )}
      </motion.div>
    </div>
  );
};
