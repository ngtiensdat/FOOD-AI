import React from 'react';
import { TrendingUp, Sparkles, Award } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface KpiSectionProps {
  totalViews: number;
  totalAiSuggestions: number;
  conversionRate: number;
}

export const KpiSection = React.memo(({ totalViews, totalAiSuggestions, conversionRate }: KpiSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Views Card */}
      <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md" aria-hidden="true">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.ANALYTICS.VIEWS}</p>
          <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
            {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recommendations Card */}
      <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md" aria-hidden="true">
          <Sparkles size={24} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.ANALYTICS.RECOMMENDATIONS}</p>
          <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
            {totalAiSuggestions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Conversion Rate Card */}
      <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md" aria-hidden="true">
          <Award size={24} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.ANALYTICS.AI_CONVERSION_RATE}</p>
          <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
            {conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
});

KpiSection.displayName = 'KpiSection';
