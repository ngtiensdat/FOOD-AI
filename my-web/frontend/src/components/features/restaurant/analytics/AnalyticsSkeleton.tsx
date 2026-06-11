import React from 'react';
import { LABELS } from '@/constants/labels';

export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label={LABELS.ANALYTICS.LOADING_ARIA}>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-72 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-72 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
};
