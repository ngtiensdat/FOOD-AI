'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { foodService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

export type DateRangePreset = '7d' | '14d' | '28d' | '90d' | 'this_month' | 'custom';

export interface AnalyticsData {
  id: number;
  name: string;
  views: number;
  aiSuggestions: number;
}

export interface AnalyticsStats {
  totalViews: number;
  totalAiSuggestions: number;
  conversionRate: number;
}

const formatDateToYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useMerchantAnalytics = () => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([]);
  const [preset, setPreset] = useState<DateRangePreset>('28d');
  
  // Custom date state
  const defaultCustomDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);
    return {
      start: formatDateToYMD(start),
      end: formatDateToYMD(end),
    };
  }, []);

  const [customStartDate, setCustomStartDate] = useState<string>(defaultCustomDates.start);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultCustomDates.end);

  const { effectiveStartDate, effectiveEndDate, dateRangeLabel } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    let label = '';

    if (preset === '7d') {
      start.setDate(end.getDate() - 7);
      label = LABELS.ANALYTICS.DATE_RANGE_LABEL(
        LABELS.ANALYTICS.PRESET_7_DAYS,
        `${start.getDate()} Tháng ${start.getMonth() + 1}`,
        `${end.getDate()} Tháng ${end.getMonth() + 1}`,
      );
    } else if (preset === '14d') {
      start.setDate(end.getDate() - 14);
      label = LABELS.ANALYTICS.DATE_RANGE_LABEL(
        LABELS.ANALYTICS.PRESET_14_DAYS,
        `${start.getDate()} Tháng ${start.getMonth() + 1}`,
        `${end.getDate()} Tháng ${end.getMonth() + 1}`,
      );
    } else if (preset === '28d') {
      start.setDate(end.getDate() - 28);
      label = LABELS.ANALYTICS.DATE_RANGE_LABEL(
        LABELS.ANALYTICS.PRESET_28_DAYS,
        `${start.getDate()} Tháng ${start.getMonth() + 1}`,
        `${end.getDate()} Tháng ${end.getMonth() + 1}`,
      );
    } else if (preset === '90d') {
      start.setDate(end.getDate() - 90);
      label = LABELS.ANALYTICS.DATE_RANGE_LABEL(
        LABELS.ANALYTICS.PRESET_90_DAYS,
        `${start.getDate()} Tháng ${start.getMonth() + 1}`,
        `${end.getDate()} Tháng ${end.getMonth() + 1}`,
      );
    } else if (preset === 'this_month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      label = LABELS.ANALYTICS.DATE_RANGE_LABEL(
        LABELS.ANALYTICS.PRESET_THIS_MONTH,
        `1 Tháng ${start.getMonth() + 1}`,
        `${end.getDate()} Tháng ${end.getMonth() + 1}`,
      );
    } else {
      // custom
      return {
        effectiveStartDate: customStartDate,
        effectiveEndDate: customEndDate,
        dateRangeLabel: LABELS.ANALYTICS.CUSTOM_RANGE_LABEL(customStartDate, customEndDate),
      };
    }

    return {
      effectiveStartDate: formatDateToYMD(start),
      effectiveEndDate: formatDateToYMD(end),
      dateRangeLabel: label,
    };
  }, [preset, customStartDate, customEndDate]);

  const fetchAnalytics = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await foodService.getMyAnalytics(start, end);
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching merchant analytics:', err);
      setError(LABELS.ANALYTICS.ERROR_FETCH_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(effectiveStartDate, effectiveEndDate);
  }, [effectiveStartDate, effectiveEndDate, fetchAnalytics]);

  const stats = useMemo<AnalyticsStats>(() => {
    const totalViews = data.reduce((sum, d) => sum + d.views, 0);
    const totalAiSuggestions = data.reduce((sum, d) => sum + d.aiSuggestions, 0);
    const conversionRate = totalViews > 0 ? (totalAiSuggestions / totalViews) * 100 : 0;

    return {
      totalViews,
      totalAiSuggestions,
      conversionRate,
    };
  }, [data]);

  const handleToggleFood = (foodId: number) => {
    setSelectedFoodIds((prev) => {
      if (prev.includes(foodId)) {
        return prev.filter((id) => id !== foodId);
      } else {
        if (prev.length >= 8) {
          toast.info(LABELS.ANALYTICS.TOAST_MAX_SELECTION);
          return prev;
        }
        return [...prev, foodId];
      }
    });
  };

  const handleSelectPreset = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
  };

  const handleApplyCustomDates = (start: string, end: string) => {
    if (!start || !end) {
      toast.error(LABELS.COMMON.ERROR);
      return;
    }
    if (new Date(start) > new Date(end)) {
      toast.error(LABELS.COMMON.ERROR);
      return;
    }
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPreset('custom');
  };

  const chartData = useMemo(() => {
    return data.filter((d) => selectedFoodIds.includes(d.id));
  }, [data, selectedFoodIds]);

  const maxVal = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => Math.max(d.views, d.aiSuggestions)), 0);
    return highest > 0 ? Math.max(highest, 10) : 10;
  }, [chartData]);

  return {
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
    refetch: () => fetchAnalytics(effectiveStartDate, effectiveEndDate),
  };
};
