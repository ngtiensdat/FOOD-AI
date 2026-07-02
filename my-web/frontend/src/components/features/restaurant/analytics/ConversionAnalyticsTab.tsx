'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, Search, Award, TrendingUp, Lightbulb } from 'lucide-react';
import { useMerchantAnalytics } from '@/hooks/useMerchantAnalytics';
import { LABELS } from '@/constants/labels';
import { Input } from '@/components/base/Input';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

export const ConversionAnalyticsTab = React.memo(() => {
  const { data, loading, error, stats } = useMerchantAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alpha'>('desc');

  const foodsWithRates = useMemo(() => {
    return data.map(f => {
      const rate = f.views > 0 ? (f.aiSuggestions / f.views) * 100 : 0;
      return { ...f, rate };
    });
  }, [data]);

  const filteredAndSortedFoods = useMemo(() => {
    let result = [...foodsWithRates];

    // Filter
    if (searchQuery.trim()) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    if (sortOrder === 'desc') {
      result.sort((a, b) => b.rate - a.rate);
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => a.rate - b.rate);
    } else if (sortOrder === 'alpha') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [foodsWithRates, searchQuery, sortOrder]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="card-premium p-12 text-center border-rose-500/20 text-rose-500">
        <p className="font-bold text-body">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Award className="text-primary" size={24} />
          {LABELS.RESTAURANT.KPI_CONVERSION}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {LABELS.ANALYTICS.TIME_PERIOD}
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.ANALYTICS.AI_CONVERSION_RATE}</p>
            <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
              {stats.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
          <div className="p-3 bg-teal-500 text-white rounded-xl shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {LABELS.ANALYTICS.TOTAL_FOODS}
            </p>
            <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
              {data.length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            variant="none"
            type="text"
            placeholder={LABELS.COMMON.SEARCH}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary dark:text-slate-200"
          />
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 font-bold whitespace-nowrap">{LABELS.ANALYTICS.SORT_BY}</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc' | 'alpha')}
            className="form-input py-2 px-3 rounded-xl text-xs font-semibold bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="desc">{LABELS.ANALYTICS.CONVERSION_DESCENDING}</option>
            <option value="asc">{LABELS.ANALYTICS.CONVERSION_ASCENDING}</option>
            <option value="alpha">{LABELS.ANALYTICS.ALPHABETICAL}</option>
          </select>
        </div>
      </div>

      {/* Conversion Table */}
      <div className="card-container overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/20">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">{LABELS.ANALYTICS.TABLE_FOOD}</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">{LABELS.ANALYTICS.TABLE_VIEWS}</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">{LABELS.ANALYTICS.TABLE_RECOMMENDATIONS}</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">{LABELS.ANALYTICS.TABLE_CONVERSION}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
            {filteredAndSortedFoods.map((food) => {
              let badgeColor = 'bg-red-50 text-red-600 dark:bg-rose-950/30 dark:text-rose-450';
              if (food.rate >= 15) {
                badgeColor = 'bg-green-50 text-green-600 dark:bg-emerald-950/30 dark:text-emerald-400';
              } else if (food.rate >= 5) {
                badgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
              }

              return (
                <tr key={food.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all">
                  <td className="px-6 py-4 text-xs font-bold text-gray-800 dark:text-slate-200">{food.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-gray-500 dark:text-slate-400">{food.views}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-gray-500 dark:text-slate-400">{food.aiSuggestions}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${badgeColor}`}>
                      {food.rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedFoods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs font-bold">
                  {LABELS.ANALYTICS.NO_FOODS_FOUND}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic business advice card */}
      <div className="card-premium p-6 space-y-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border-primary/20">
        <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2">
          <Lightbulb className="text-primary" size={20} />
          <span>{LABELS.ANALYTICS.AI_INSIGHTS}</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed font-bold">
          {stats.conversionRate > 10
            ? LABELS.ANALYTICS.CONVERSION_EXCELLENT_ADVICE
            : LABELS.ANALYTICS.CONVERSION_NEED_IMPROVEMENT_ADVICE}
        </p>
      </div>
    </div>
  );
});

ConversionAnalyticsTab.displayName = 'ConversionAnalyticsTab';
