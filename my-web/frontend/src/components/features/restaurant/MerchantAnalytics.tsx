import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, ChevronDown, Calendar, Check } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';

// Hooks
import { useMerchantAnalytics, DateRangePreset } from '@/hooks/useMerchantAnalytics';

// Subcomponents
import { AnalyticsSkeleton } from './analytics/AnalyticsSkeleton';
import { KpiSection } from './analytics/KpiSection';
import { DoubleBarChart } from './analytics/DoubleBarChart';

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
    preset,
    customStartDate,
    customEndDate,
    dateRangeLabel,
    handleSelectPreset,
    handleApplyCustomDates,
  } = useMerchantAnalytics();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempStart, setTempStart] = useState(customStartDate);
  const [tempEnd, setTempEnd] = useState(customEndDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync temp dates when custom dates change
  useEffect(() => {
    setTempStart(customStartDate);
    setTempEnd(customEndDate);
  }, [customStartDate, customEndDate]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  if (loading && data.length === 0) {
    return <AnalyticsSkeleton />;
  }

  if (error && data.length === 0) {
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

  const presetsList: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: LABELS.ANALYTICS.PRESET_7_DAYS },
    { id: '14d', label: LABELS.ANALYTICS.PRESET_14_DAYS },
    { id: '28d', label: LABELS.ANALYTICS.PRESET_28_DAYS },
    { id: '90d', label: LABELS.ANALYTICS.PRESET_90_DAYS },
    { id: 'this_month', label: LABELS.ANALYTICS.PRESET_THIS_MONTH },
  ];

  return (
    <div className="space-y-8 fade-in">
      {data.length === 0 && !loading ? (
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

              {/* Date Filter & Actions */}
              <div className="relative flex items-center gap-3" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="bg-gray-50 dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-900 hover:border-primary/40 transition-all shadow-xs"
                >
                  <Calendar size={13} className="text-primary shrink-0" />
                  <span>{dateRangeLabel}</span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Picker */}
                {isDatePickerOpen && (
                  <div className="absolute right-0 top-10 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {LABELS.ANALYTICS.CHOOSE_DATE_RANGE}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {presetsList.map((item) => {
                          const isSelected = preset === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                handleSelectPreset(item.id);
                                setIsDatePickerOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                                isSelected
                                  ? 'bg-primary text-white font-bold shadow-xs'
                                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>{item.label}</span>
                              {isSelected && <Check size={13} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Range Picker */}
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2.5">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400">
                        {LABELS.ANALYTICS.PRESET_CUSTOM}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">
                            {LABELS.ANALYTICS.START_DATE}
                          </label>
                          <Input
                            type="date"
                            variant="none"
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">
                            {LABELS.ANALYTICS.END_DATE}
                          </label>
                          <Input
                            type="date"
                            variant="none"
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          handleApplyCustomDates(tempStart, tempEnd);
                          setIsDatePickerOpen(false);
                        }}
                        className="w-full text-xs font-bold py-2 mt-1 rounded-xl shadow-xs"
                      >
                        {LABELS.ANALYTICS.APPLY_FILTER}
                      </Button>
                    </div>
                  </div>
                )}
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
