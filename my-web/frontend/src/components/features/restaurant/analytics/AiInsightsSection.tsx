import React from 'react';
import { Lightbulb } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Food } from '@/types/food';

interface AiInsightsSectionProps {
  myFoods?: Food[];
  restaurantName?: string;
}

interface ExtendedAnalyticsLabels {
  INSIGHT_TIPS: string[];
  INSIGHT_TIP_TOP: (food: string) => string;
  INSIGHT_TIP_OPTIMIZE: (food: string) => string;
  INSIGHT_TIP_COMBO: (food: string) => string;
  INSIGHT_TIP_GOLDEN_HOUR: (store: string) => string;
}

export const AiInsightsSection = React.memo(({ myFoods, restaurantName }: AiInsightsSectionProps) => {
  const tips = React.useMemo(() => {
    if (!myFoods || myFoods.length === 0) {
      return LABELS.ANALYTICS.INSIGHT_TIPS;
    }

    const analyticsLabels = LABELS.ANALYTICS as unknown as ExtendedAnalyticsLabels;
    const generated: string[] = [];
    const firstFood = myFoods[0];
    const secondFood = myFoods[1];

    if (firstFood) {
      generated.push(analyticsLabels.INSIGHT_TIP_TOP(firstFood.name));
    }

    if (secondFood) {
      generated.push(analyticsLabels.INSIGHT_TIP_OPTIMIZE(secondFood.name));
    } else if (firstFood) {
      generated.push(analyticsLabels.INSIGHT_TIP_COMBO(firstFood.name));
    }

    const name = restaurantName || LABELS.COMMON.STORE;
    generated.push(analyticsLabels.INSIGHT_TIP_GOLDEN_HOUR(name));

    return generated;
  }, [myFoods, restaurantName]);

  return (
    <div className="card-premium p-6 space-y-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border-primary/20">
      <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2">
        <Lightbulb className="text-primary" size={20} aria-hidden="true" />
        {LABELS.ANALYTICS.AI_INSIGHTS}
      </h3>

      <div className="space-y-3" role="list">
        {tips.map((tip, idx) => (
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
