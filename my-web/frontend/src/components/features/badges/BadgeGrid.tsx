import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, CheckCircle2, Star, Eye, Users } from 'lucide-react';
import { UserRole } from '@/types/user';
import { Button } from '@/components/base/Button';

interface BadgeConfig {
  id: string;
  role: string;
  title: string;
  points: number;
  minReviews: number | null;
  minPostLikes: number | null;
  minRatingAvg: number | null;
  minRatingCount: number | null;
  minFollowers: number | null;
}

interface BadgeGridProps {
  badges: BadgeConfig[];
  activeRoleTab: UserRole.CUSTOMER | UserRole.RESTAURANT;
  setActiveRoleTab: (role: UserRole.CUSTOMER | UserRole.RESTAURANT) => void;
  userBadge: string | null;
  userPoints: number;
  userReviewsCount: number;
  userFollowersCount: number;
  isAuthenticated: boolean;
  userRole?: string;
  labels: {
    BADGES_SYSTEM_TITLE: string;
    BADGES_SYSTEM_DESC: string;
    TAB_CUSTOMER: string;
    TAB_RESTAURANT: string;
    USING_BADGE: string;
    MIN_POINTS: string;
    MIN_REVIEWS: string;
    POST_UNIT: string;
    MIN_FOLLOWERS: string;
    USER_UNIT: string;
  };
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  activeRoleTab,
  setActiveRoleTab,
  userBadge,
  userPoints,
  userReviewsCount,
  userFollowersCount,
  isAuthenticated,
  userRole,
  labels,
}) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-lg space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <Award size={22} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">{labels.BADGES_SYSTEM_TITLE}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{labels.BADGES_SYSTEM_DESC}</p>
          </div>
        </div>

        {/* Tabs role filter */}
        {(!isAuthenticated || userRole === 'ADMIN') && (
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <Button
              onClick={() => setActiveRoleTab(UserRole.CUSTOMER)}
              variant="none"
              size="none"
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRoleTab === UserRole.CUSTOMER
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {labels.TAB_CUSTOMER}
            </Button>
            <Button
              onClick={() => setActiveRoleTab(UserRole.RESTAURANT)}
              variant="none"
              size="none"
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRoleTab === UserRole.RESTAURANT
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {labels.TAB_RESTAURANT}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges
          .filter((b) => b.role === activeRoleTab)
          .sort((a, b) => a.points - b.points)
          .map((badge) => {
            // Check if unlocked
            // 1. If badgeTitle equals current title -> Active/Unlocked
            const isActive = userBadge === badge.title;
            
            // 2. Or if points and counts are met
            const meetsPoints = userPoints >= badge.points;
            const meetsReviews = badge.minReviews === null || userReviewsCount >= badge.minReviews;
            const meetsFollowers = badge.minFollowers === null || userFollowersCount >= badge.minFollowers;
            const isUnlocked = isActive || (isAuthenticated && meetsPoints && meetsReviews && meetsFollowers);

            return (
              <div
                key={badge.id}
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
                  isUnlocked
                    ? isActive
                      ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-gray-50 dark:bg-slate-900/30 border-gray-200/50 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      isUnlocked
                        ? isActive
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md'
                          : 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-400'
                    }`}
                  >
                    <Award size={24} />
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {badge.title}
                        {isActive && (
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">
                            {labels.USING_BADGE}
                          </span>
                        )}
                      </h4>
                      {isUnlocked ? (
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Lock size={16} className="text-gray-400 shrink-0" />
                      )}
                    </div>

                    {/* Threshold requirements display */}
                    <div className="space-y-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {labels.MIN_POINTS}</span>
                        <span className={userPoints >= badge.points ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'font-bold'}>
                          {badge.points.toLocaleString()} XP
                        </span>
                      </div>

                      {badge.minReviews !== null && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Eye size={12} className="text-blue-500" /> {labels.MIN_REVIEWS}</span>
                          <span className={meetsReviews ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'font-bold'}>
                            {badge.minReviews} {labels.POST_UNIT}
                          </span>
                        </div>
                      )}

                      {badge.minFollowers !== null && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Users size={12} className="text-purple-500" /> {labels.MIN_FOLLOWERS}</span>
                          <span className={meetsFollowers ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'font-bold'}>
                            {badge.minFollowers} {labels.USER_UNIT}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
};
