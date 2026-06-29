import React from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';

// Hooks
import { useMerchantAnalytics } from '@/hooks/useMerchantAnalytics';

// Subcomponents
import { AnalyticsSkeleton } from './analytics/AnalyticsSkeleton';
import { KpiSection } from './analytics/KpiSection';
import { DoubleBarChart } from './analytics/DoubleBarChart';
import { AiInsightsSection } from './analytics/AiInsightsSection';

export const MerchantAnalytics = () => {
  const {
    data,
    loading,
    error,
    stats,
    selectedFoodIds,
    handleToggleFood,
    chartData,
    maxVal,
  } = useMerchantAnalytics();

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div 
        className="card-premium p-12 text-center border border-rose-200 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl flex flex-col items-center justify-center animate-fade-in"
        role="alert"
      >
        <BarChart3 size={48} className="text-rose-500 mb-4 stroke-[1.5]" aria-hidden="true" />
        <h3 className="text-lg font-bold text-rose-500 mb-2">{LABELS.ANALYTICS.ERROR_OCCURRED}</h3>
        <p className="text-gray-500 text-small max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {data.length === 0 ? (
        <div className="card-premium p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800/50 flex flex-col items-center justify-center">
          <BarChart3 size={48} className="text-gray-300 dark:text-slate-700 mb-4 stroke-[1.5]" aria-hidden="true" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">{LABELS.ANALYTICS.EMPTY_TITLE}</h3>
          <p className="text-gray-400 text-small max-w-sm">{LABELS.ANALYTICS.EMPTY_DESC}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Insights Card Container (FB Creator Studio Style) */}
          <div className="card-container p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-body font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="text-primary" size={20} />
                  <span>{LABELS.ANALYTICS.DETAILS}</span>
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">{LABELS.ANALYTICS.DETAILS_SUBTITLE}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors">
                  <span>{LABELS.ANALYTICS.LAST_28_DAYS}</span>
                  <ChevronDown size={12} />
                </div>
                <button className="text-[10px] font-bold text-primary hover:underline cursor-pointer">{LABELS.COMMON.SEE_ALL}</button>
              </div>
            </div>

            {/* KPI Tabs */}
            <KpiSection
              totalViews={stats.totalViews}
              totalAiSuggestions={stats.totalAiSuggestions}
              conversionRate={stats.conversionRate}
            />

            {/* Chart */}
            <DoubleBarChart data={chartData} maxVal={maxVal} />
          </div>

          {/* Food Selector Panel */}
          <div className="card-premium p-6 space-y-4">
            <h3 className="text-body font-black text-gray-800 dark:text-white">
              {LABELS.ANALYTICS.COMPARE_SELECT_TITLE}
            </h3>
            <div 
              className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1"
              role="group"
              aria-label={LABELS.ANALYTICS.COMPARE_SELECT_ARIA}
            >
              {data.map((food) => {
                const isSelected = selectedFoodIds.includes(food.id);
                return (
                  <Button
                    key={food.id}
                    onClick={() => handleToggleFood(food.id)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40 font-black scale-95'
                        : 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-900'
                    }`}
                    variant="none"
                    size="none"
                  >
                    {food.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
