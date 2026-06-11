'use client';

import { useState, useEffect, useMemo } from 'react';
import { foodService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

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

export const useMerchantAnalytics = () => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await foodService.getMyAnalytics();
        if (active) {
          setData(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error('Error fetching merchant analytics:', err);
        if (active) {
          setError(LABELS.ANALYTICS.ERROR_FETCH_FAILED);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchAnalytics();
    return () => {
      active = false;
    };
  }, []);

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
  };
};
