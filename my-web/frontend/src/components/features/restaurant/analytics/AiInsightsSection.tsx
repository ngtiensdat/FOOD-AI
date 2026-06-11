import React from 'react';
import { Lightbulb } from 'lucide-react';
import { LABELS } from '@/constants/labels';

export const AiInsightsSection = React.memo(() => {
  return (
    <div className="card-premium p-6 space-y-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border-primary/20">
      <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2">
        <Lightbulb className="text-primary" size={20} aria-hidden="true" />
        {LABELS.ANALYTICS.AI_INSIGHTS}
      </h3>

      <div className="space-y-3" role="list">
        {LABELS.ANALYTICS.INSIGHT_TIPS.map((tip, idx) => (
          <div 
            key={idx}
            role="listitem"
            className="p-3 bg-white/70 dark:bg-slate-900/40 border border-orange-100 dark:border-slate-800 rounded-2xl text-xs flex gap-2.5 items-start leading-relaxed text-gray-700 dark:text-slate-300"
          >
            <span className="text-sm" aria-hidden="true">💡</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

AiInsightsSection.displayName = 'AiInsightsSection';
