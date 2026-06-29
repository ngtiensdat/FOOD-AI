'use client';

import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle, Clock3, XCircle, Search, Edit2 } from 'lucide-react';
import { useRestaurantActions } from '@/hooks/useRestaurantActions';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { Input } from '@/components/base/Input';

export const ActivityAnalyticsTab = React.memo(() => {
  const { user } = useAuth();
  const { myFoods, loading } = useRestaurantActions(user);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return myFoods;
    return myFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [myFoods, searchQuery]);

  const activities = useMemo(() => {
    const analyticsLabels = LABELS.ANALYTICS as any;
    return filteredFoods.map(food => {
      let icon = <Clock3 className="text-orange-500" size={18} />;
      let title = '';
      let desc = '';
      let statusColor = 'text-orange-500';

      if (food.status === 'APPROVED') {
        icon = <CheckCircle className="text-emerald-500" size={18} />;
        title = typeof analyticsLabels.ACTIVITY_APPROVED_TITLE === 'function'
          ? analyticsLabels.ACTIVITY_APPROVED_TITLE(food.name)
          : `Món ăn "${food.name}" đã được duyệt`;
        desc = typeof analyticsLabels.ACTIVITY_APPROVED_DESC === 'function'
          ? analyticsLabels.ACTIVITY_APPROVED_DESC(food.name)
          : `Admin hệ thống đã phê duyệt món "${food.name}" hiển thị trên trang Khám phá.`;
        statusColor = 'text-emerald-500';
      } else if (food.status === 'PENDING') {
        icon = <Clock3 className="text-amber-500" size={18} />;
        title = typeof analyticsLabels.ACTIVITY_PENDING_TITLE === 'function'
          ? analyticsLabels.ACTIVITY_PENDING_TITLE(food.name)
          : `Đang chờ duyệt món "${food.name}"`;
        desc = typeof analyticsLabels.ACTIVITY_PENDING_DESC === 'function'
          ? analyticsLabels.ACTIVITY_PENDING_DESC(food.name)
          : `Yêu cầu đăng món "${food.name}" đã được ghi nhận và đang chờ Admin phê duyệt.`;
        statusColor = 'text-amber-500';
      } else {
        icon = <XCircle className="text-rose-500" size={18} />;
        title = typeof analyticsLabels.ACTIVITY_REJECTED_TITLE === 'function'
          ? analyticsLabels.ACTIVITY_REJECTED_TITLE(food.name)
          : `Bác bỏ món "${food.name}"`;
        desc = typeof analyticsLabels.ACTIVITY_REJECTED_DESC === 'function'
          ? analyticsLabels.ACTIVITY_REJECTED_DESC(food.name)
          : `Yêu cầu đăng món "${food.name}" không đạt tiêu chuẩn nội dung của hệ thống.`;
        statusColor = 'text-rose-500';
      }

      return {
        id: food.id,
        title,
        desc,
        time: food.createdAt ? new Date(food.createdAt).toLocaleDateString() : (LABELS.ANALYTICS as any).ACTIVITY_JUST_NOW,
        icon,
        statusColor,
      };
    });
  }, [filteredFoods]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="w-48 h-8 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <div className="w-full h-40 bg-gray-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="text-primary" size={24} />
          {LABELS.RESTAURANT.RECENT_ACTIVITY}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {(LABELS.ANALYTICS as any).ACTIVITY_SUBTITLE}
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex gap-4 justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
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
      </div>

      {/* Activity Timeline */}
      <div className="card-container p-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
        {activities.length > 0 ? (
          <div className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-4 space-y-8">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-8">
                {/* Dot */}
                <div className="absolute -left-[11px] top-1 bg-white dark:bg-slate-900 p-1 rounded-full border-2 border-gray-200 dark:border-slate-800">
                  {act.icon}
                </div>
                
                {/* Content */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="text-sm font-extrabold text-gray-800 dark:text-slate-200">{act.title}</h4>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 whitespace-nowrap">{act.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-bold leading-relaxed">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12 text-xs font-bold">{(LABELS.ANALYTICS as any).NO_ACTIVITIES}</p>
        )}
      </div>
    </div>
  );
});

ActivityAnalyticsTab.displayName = 'ActivityAnalyticsTab';
