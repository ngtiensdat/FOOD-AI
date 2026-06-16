'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, Trophy, X } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  badge?: string | null;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  level,
  badge,
}) => {
  const labels = LABELS.LOYALTY.LEVEL_UP_MODAL;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/20 bg-white dark:bg-slate-900 p-6 md:p-8 text-center shadow-2xl z-10"
          >
            {/* Close button */}
            <Button
              onClick={onClose}
              variant="none"
              size="none"
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </Button>

            {/* Glowing backgrounds */}
            <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-orange-600/10 blur-3xl" />

            {/* Mascot Image */}
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="relative mx-auto w-44 h-44 flex items-center justify-center mb-6"
            >
              {/* Outer rays */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 opacity-20 blur-xl animate-pulse" />
              <SafeImage
                src="/chibi linh vật/chúc mừng.png"
                alt={labels.CONGRATS}
                fill
                className="object-contain relative z-10"
              />
            </motion.div>

            {/* Header info */}
            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent uppercase tracking-wide">
                {labels.CONGRATS}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                {labels.NEW_ACHIEVEMENT}
              </p>
            </div>

            {/* Main content info */}
            <div className="my-6 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 space-y-3 relative z-10">
              <div className="flex justify-center items-center gap-1.5">
                <Trophy size={18} className="text-amber-500 animate-bounce" />
                <span className="text-gray-900 dark:text-white font-extrabold text-base">
                  {labels.LEVEL_ACHIEVED}
                </span>
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-black shadow-sm">
                  Lv.{level}
                </span>
              </div>

              {badge && (
                <div className="flex justify-center items-center gap-1.5 pt-2 border-t border-dashed border-amber-500/10">
                  <Award size={18} className="text-orange-500" />
                  <span className="text-gray-900 dark:text-white font-extrabold text-base">
                    {labels.NEW_BADGE}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">
                    ✨ {badge}
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <Button
              variant="primary"
              onClick={onClose}
              fullWidth
              className="py-3 font-bold text-sm shadow-md rounded-2xl"
            >
              {labels.GREAT}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
