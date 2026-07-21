'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, Search, Eye, TrendingUp, Sparkles } from 'lucide-react';
import { useMerchantAnalytics } from '@/hooks/useMerchantAnalytics';
import { LABELS } from '@/constants/labels';
import { Input } from '@/components/base/Input';
import { Button } from '@/components/base/Button';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

export const ViewsAnalyticsTab = React.memo(() => {
  const { data, loading, error, stats } = useMerchantAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alpha'>('desc');

  const filteredAndSortedFoods = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchQuery.trim()) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    if (sortOrder === 'desc') {
      result.sort((a, b) => b.views - a.views);
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => a.views - b.views);
    } else if (sortOrder === 'alpha') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [data, searchQuery, sortOrder]);

  const maxViews = useMemo(() => {
    return Math.max(...data.map(f => f.views), 1);
  }, [data]);

  const avgViews = useMemo(() => {
    if (data.length === 0) return 0;
    return stats.totalViews / data.length;
  }, [data, stats.totalViews]);

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
          <Eye className="text-primary" size={24} />
          {LABELS.RESTAURANT.KPI_VIEWS}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {LABELS.ANALYTICS.DETAILS_SUBTITLE}
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.ANALYTICS.VIEWS}</p>
            <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card-premium p-6 flex items-center gap-4 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {LABELS.ANALYTICS.AVERAGE_VIEWS}
            </p>
            <p className="text-h2 !text-2xl text-gray-800 dark:text-white mt-1 font-extrabold">
              {avgViews.toFixed(1)}
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
            <option value="desc">{LABELS.ANALYTICS.MOST_VIEWED}</option>
            <option value="asc">{LABELS.ANALYTICS.LEAST_VIEWED}</option>
            <option value="alpha">{LABELS.ANALYTICS.ALPHABETICAL}</option>
          </select>
        </div>
      </div>

      {/* Views List */}
      <div className="card-container p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-primary" size={20} />
          <span>{LABELS.ANALYTICS.VIEWS_DETAIL_CHART}</span>
        </h3>

        <div className="space-y-4">
          {filteredAndSortedFoods.map((food) => {
            const percentage = (food.views / maxViews) * 100;
            return (
              <div key={food.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-800 dark:text-slate-200">{food.name}</span>
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <Eye size={12} />
                    {food.views}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {filteredAndSortedFoods.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-xs">{LABELS.ANALYTICS.NO_FOODS_FOUND}</p>
          )}
        </div>
      </div>
    </div>
  );
});

ViewsAnalyticsTab.displayName = 'ViewsAnalyticsTab';
