import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { Button } from '@/components/base/Button';
import { User, UserRole } from '@/types/user';

interface UserXpCardProps {
  isAuthenticated: boolean;
  profile: (Partial<User> & { profile?: { avatar?: string | null } }) | null;
  me: Partial<User> | null;
  userLevel: number;
  userPoints: number;
  userBadge: string | null;
  userReviewsCount: number;
  xpProgress: number;
  pointsPerLevel: number;
  xpPercent: number;
  onLoginClick: () => void;
  labels: {
    RESTAURANT_ROLE_LABEL: string;
    CUSTOMER_ROLE_LABEL: string;
    POINTS_BALANCE_LABEL: string;
    POSTS_COUNT_LABEL: string;
    XP_PROGRESS_LABEL: string;
    GUEST_TITLE: string;
    GUEST_DESC: string;
    LOGIN_NOW: string;
  };
}

export const UserXpCard: React.FC<UserXpCardProps> = ({
  isAuthenticated,
  profile,
  me,
  userLevel,
  userPoints,
  userBadge,
  userReviewsCount,
  xpProgress,
  pointsPerLevel,
  xpPercent,
  onLoginClick,
  labels,
}) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 md:p-8 shadow-xl"
    >
      {/* Decorative glow */}
      <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />

      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400/80 p-1 shadow-lg">
                <Avatar
                  src={profile?.profile?.avatar}
                  name={profile?.name ?? me?.name}
                  size={112}
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                Lv.{userLevel}
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 space-y-2">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex flex-wrap justify-center sm:justify-start items-center gap-2">
                {profile?.name ?? me?.name}
                {userBadge && (
                  <span className="text-xs font-bold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                    ✨ {userBadge}
                  </span>
                )}
              </h2>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                {profile?.role === UserRole.RESTAURANT ? labels.RESTAURANT_ROLE_LABEL : labels.CUSTOMER_ROLE_LABEL}
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm font-semibold text-gray-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500">⭐</span>
                  <span>{userPoints.toLocaleString()} {labels.POINTS_BALANCE_LABEL}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Eye size={16} className="text-blue-500" />
                  <span>{userReviewsCount} {labels.POSTS_COUNT_LABEL}</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-slate-400">
              <span>{labels.XP_PROGRESS_LABEL}</span>
              <span>{xpProgress} / {pointsPerLevel} XP</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden border border-gray-200/50 dark:border-slate-700/50 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 flex items-center justify-end pr-2 text-[9px] font-black text-white"
              >
                {xpPercent > 15 && `${Math.round(xpPercent)}%`}
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{labels.GUEST_TITLE}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {labels.GUEST_DESC}
            </p>
          </div>
          <Button variant="primary" onClick={onLoginClick} className="px-6 font-bold shadow-md">
            {labels.LOGIN_NOW}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
