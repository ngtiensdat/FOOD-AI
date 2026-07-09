/**
 * Mục đích file này: Component hiển thị bảng quy chế tính điểm thưởng và các điều kiện phạt (anti-farm) trên giao diện Cấp độ & Danh hiệu.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị dữ liệu động cấu hình gamification lấy từ backend hoặc fallback hằng số mặc định.
 * Các chức năng đặc biệt: hiển thị trực quan các mức điểm cộng cho review/like/comment/reply và giới hạn hàng ngày.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Eye, MessageSquare, Heart } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';

interface PointsRulesTableProps {
  rules: {
    pointsPerLevel?: number;
    postReviewPoints?: number;
    commentPoints?: number;
    likePoints?: number;
    deductionMultiplier?: number;
    dailyCommentLimit?: number;
  } | null;
  labels: {
    RULES_TITLE: string;
    RULES_DESC: string;
    ACTIVITY_COL: string;
    POINTS_COL: string;
    DESC_COL: string;
    ACT_POST: string;
    ACT_POST_DESC: string;
    ACT_COMMENT: string;
    ACT_COMMENT_DESC: string;
    ACT_REPLY: string;
    ACT_REPLY_DESC: string;
    ACT_LIKE: string;
    ACT_LIKE_DESC: string;
    ANTI_FARM_WARNING_TITLE: string;
    ANTI_FARM_WARNING_BODY: (multiplier: number, points: number) => string;
    DAILY_LIMIT_LABEL: (limit: number) => string;
  };
  constants: {
    FALLBACK_RULES: {
      pointsPerLevel: number;
      postReviewPoints: number;
      commentPoints: number;
      likePoints: number;
      deductionMultiplier: number;
    };
  };
}

export const PointsRulesTable: React.FC<PointsRulesTableProps> = ({ rules, labels, constants }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-lg space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-500">
          <Zap size={22} />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">{labels.RULES_TITLE}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">{labels.RULES_DESC}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">{labels.ACTIVITY_COL}</th>
              <th className="pb-3 px-4 text-center">{labels.POINTS_COL}</th>
              <th className="pb-3 pl-4 text-right">{labels.DESC_COL}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm font-semibold text-gray-700 dark:text-slate-300">
            <tr>
              <td className="py-3.5 pr-4 font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Eye size={16} className="text-blue-500" /> {labels.ACT_POST}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black">
                  +{rules?.postReviewPoints ?? constants.FALLBACK_RULES.postReviewPoints}
                </span>
              </td>
              <td className="py-3.5 pl-4 text-right text-xs text-gray-500 dark:text-slate-400">
                {labels.ACT_POST_DESC}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 pr-4 font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <MessageSquare size={16} className="text-purple-500" /> {labels.ACT_COMMENT}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black">
                  +{rules?.commentPoints ?? constants.FALLBACK_RULES.commentPoints}
                </span>
              </td>
              <td className="py-3.5 pl-4 text-right text-xs text-gray-500 dark:text-slate-400">
                {labels.ACT_COMMENT_DESC} {rules?.dailyCommentLimit !== undefined && labels.DAILY_LIMIT_LABEL(rules.dailyCommentLimit)}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 pr-4 font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <MessageSquare size={16} className="text-indigo-400" /> {labels.ACT_REPLY}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black">
                  +{Math.round((rules?.commentPoints ?? constants.FALLBACK_RULES.commentPoints) / 2)}
                </span>
              </td>
              <td className="py-3.5 pl-4 text-right text-xs text-gray-500 dark:text-slate-400">
                {labels.ACT_REPLY_DESC} {rules?.dailyCommentLimit !== undefined && labels.DAILY_LIMIT_LABEL(rules.dailyCommentLimit)}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 pr-4 font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Heart size={16} className="text-rose-500" /> {labels.ACT_LIKE}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black">
                  +{rules?.likePoints ?? constants.FALLBACK_RULES.likePoints}
                </span>
              </td>
              <td className="py-3.5 pl-4 text-right text-xs text-gray-500 dark:text-slate-400">
                {labels.ACT_LIKE_DESC}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {rules?.deductionMultiplier && rules.deductionMultiplier > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 mt-4 text-amber-800 dark:text-amber-400 text-xs leading-relaxed font-semibold">
          <SafeImage
            src="/chibi linh vật/lưu ý.png"
            alt="Lưu ý"
            width={48}
            height={48}
            className="w-12 h-12 shrink-0 object-contain animate-pulse"
          />
          <div>
            <p className="font-bold mb-0.5 text-amber-900 dark:text-amber-300">{labels.ANTI_FARM_WARNING_TITLE}</p>
            <p className="opacity-90">
              {labels.ANTI_FARM_WARNING_BODY(
                rules.deductionMultiplier,
                rules.likePoints ?? constants.FALLBACK_RULES.likePoints
              )}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
