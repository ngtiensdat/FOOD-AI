import React from 'react';
import SafeImage from '@/components/base/SafeImage';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { LABELS } from '@/constants/labels';

import { User } from '@/types/user';

interface LeaderboardUser {
  id: number;
  name: string;
  role: string;
  points: number;
  level: number;
  badgeTitle: string | null;
  profile?: {
    avatar: string | null;
  };
}

interface LeaderboardListProps {
  leaderboard: LeaderboardUser[];
  me: Partial<User> | null;
  onUserClick: (id: number) => void;
  labels: {
    LEADERBOARD_TITLE: string;
    LEADERBOARD_SUBTITLE: string;
    LEADERBOARD_TIME_PERIOD: string;
    EMPTY_LEADERBOARD: string;
    YOU_LABEL: string;
    RANK_TOOLTIP?: (rank: number) => string;
  };
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({
  leaderboard,
  me,
  onUserClick,
  labels,
}) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <Trophy size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-950 dark:text-white">{labels.LEADERBOARD_TITLE}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{labels.LEADERBOARD_SUBTITLE}</p>
          </div>
        </div>

        <span className="text-mini font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50">
          {labels.LEADERBOARD_TIME_PERIOD}
        </span>
      </div>

      <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
        {leaderboard.length === 0 ? (
          <p className="text-center text-sm text-gray-400 italic py-8">{labels.EMPTY_LEADERBOARD}</p>
        ) : (
          leaderboard.map((item, index) => {
            const isTop1 = index === 0;
            const isTop2 = index === 1;
            const isTop3 = index === 2;
            const isMe = me?.id === item.id;
            const containerClass = isMe
              ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20'
              : 'bg-gray-50 dark:bg-slate-900/40 border-gray-100 dark:border-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-800/50';

            return (
              <div
                key={item.id}
                onClick={() => onUserClick(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${containerClass}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank number or Crown */}
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                    {isTop1 ? (
                      <SafeImage src="/images/badges/medal_gold.png" alt="Gold" width={28} height={28} className="object-contain" />
                    ) : isTop2 ? (
                      <SafeImage src="/images/badges/medal_silver.png" alt="Silver" width={28} height={28} className="object-contain" />
                    ) : isTop3 ? (
                      <SafeImage src="/images/badges/medal_bronze.png" alt="Bronze" width={28} height={28} className="object-contain" />
                    ) : (
                      <span className="text-sm font-black text-gray-400 dark:text-slate-500">#{index + 1}</span>
                    )}
                  </div>

                  <Avatar
                    src={item.profile?.avatar}
                    name={item.name}
                    size={40}
                    className="w-10 h-10 rounded-full shrink-0 border border-gray-100/50 dark:border-slate-800"
                  />

                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      {item.name}
                      {isMe && (
                        <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full">
                          {labels.YOU_LABEL}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] font-black text-amber-500 dark:text-amber-400 truncate flex items-center gap-1 mt-0.5">
                      <SafeImage src="/images/badges/badge_star.png" alt="Star" width={12} height={12} className="object-contain shrink-0" />
                      <span>{item.badgeTitle || LABELS.SOCIAL.SIDEBAR.NEW}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg">
                    Lv.{item.level}
                  </span>
                  <p className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 mt-1">
                    {item.points.toLocaleString()} XP
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
