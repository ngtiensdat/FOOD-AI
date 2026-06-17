/**
 * Mục đích file này để làm gì: Component chính điều phối Thống kê và Phân tích dành cho Chủ nhà hàng (MerchantAnalytics).
 * Các file khác hay file này có ý nghĩa như nào: Đóng vai trò là entrypoint/wrapper sạch sẽ của phân hệ Analytics, gọi custom hook và kết hợp các presentational subcomponents.
 */
'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LABELS } from '@/constants/labels';

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
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-1">
          <BarChart3 className="text-primary" size={28} aria-hidden="true" />
          {LABELS.ANALYTICS.TITLE}
        </h2>
        <p className="text-sm text-gray-500">{LABELS.ANALYTICS.TIME_PERIOD}</p>
      </div>

      {data.length === 0 ? (
        <div className="card-premium p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800/50 flex flex-col items-center justify-center">
          <BarChart3 size={48} className="text-gray-300 dark:text-slate-700 mb-4 stroke-[1.5]" aria-hidden="true" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">{LABELS.ANALYTICS.EMPTY_TITLE}</h3>
          <p className="text-gray-400 text-small max-w-sm">{LABELS.ANALYTICS.EMPTY_DESC}</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <KpiSection
            totalViews={stats.totalViews}
            totalAiSuggestions={stats.totalAiSuggestions}
            conversionRate={stats.conversionRate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Interactive SVG Chart */}
              <DoubleBarChart data={chartData} maxVal={maxVal} />

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
                      <button
                        key={food.id}
                        onClick={() => handleToggleFood(food.id)}
                        aria-pressed={isSelected}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40 font-black scale-95'
                            : 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        {food.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Recommendation Tips */}
            <AiInsightsSection />
          </div>
        </>
      )}
    </div>
  );
};
