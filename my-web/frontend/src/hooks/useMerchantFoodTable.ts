// Mục đích: Quản lý trạng thái cập nhật hàng loạt, nháp, mở rộng đối tác và phân trang món ăn cho bảng đối tác.
// Ý nghĩa: Tách biệt logic thao tác dữ liệu thô và trạng thái cập nhật nháp (draft updates) của đối tác khỏi view component.
// Chức năng đặc biệt: Nhóm món ăn theo đối tác, quản lý các thay đổi nháp trước khi lưu hàng loạt (batch update) hoặc hủy bỏ.
// Design Pattern: Custom Hook pattern, Memoization (useMemo, useCallback).
// Biến, hàm đặc biệt: useMerchantFoodTable, groupedMerchantFoods, handleToggleDraft, handleSaveBatch, handleDeselectAll.

'use client';

import { useState, useMemo, useCallback } from 'react';
import { AdminFoodItem } from '@/types/food';
import { UserStatus } from '@/types/user';
import { FoodBatchUpdateInput } from '@/services/admin.service';
import { LABELS } from '@/constants/labels';

interface UseMerchantFoodTableProps {
  filteredData: AdminFoodItem[];
  actions: {
    handleBatchUpdate?: (updates: FoodBatchUpdateInput[]) => Promise<boolean>;
  };
}

export const useMerchantFoodTable = ({
  filteredData,
  actions,
}: UseMerchantFoodTableProps) => {
  // --- States ---
  const [expandedMerchants, setExpandedMerchants] = useState<number[]>([]);
  const [restaurantPages, setRestaurantPages] = useState<Record<number, number>>({});
  const [draftUpdates, setDraftUpdates] = useState<Record<number, { isFeaturedToday?: boolean; isFeaturedWeekly?: boolean; isAdminRecommended?: boolean }>>({});

  // --- Memoized Grouping ---
  const groupedMerchantFoods = useMemo(() => {
    const grouped: {
      restaurantId: number;
      restaurantName: string;
      foods: AdminFoodItem[];
    }[] = [];

    filteredData.forEach((item) => {
      const rId = item.restaurantId ?? -1;
      let group = grouped.find((g) => g.restaurantId === rId);
      if (!group) {
        group = {
          restaurantId: rId,
          restaurantName: item.restaurant?.name || LABELS.COMMON.UNKNOWN,
          foods: [],
        };
        grouped.push(group);
      }
      group.foods.push(item);
    });

    // Sort restaurants by name
    grouped.sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));

    return grouped;
  }, [filteredData]);

  // --- Event Handlers (useCallback) ---
  const toggleMerchant = useCallback((id: number) => {
    setExpandedMerchants((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  }, []);

  const handleToggleDraft = useCallback((
    foodId: number,
    field: 'isFeaturedToday' | 'isFeaturedWeekly' | 'isAdminRecommended',
    currentValue: boolean
  ) => {
    setDraftUpdates((prev) => {
      const currentDraft = prev[foodId] || {};
      const originalVal = filteredData.find((f) => f.id === foodId)?.[field];
      const currentVal = currentDraft[field] !== undefined ? currentDraft[field] : originalVal;

      const newDraft = {
        ...currentDraft,
        [field]: !currentVal,
      };

      const updatedOriginalVal = filteredData.find((f) => f.id === foodId)?.[field];
      if (newDraft[field] === updatedOriginalVal) {
        delete newDraft[field];
      }

      const next = { ...prev };
      if (Object.keys(newDraft).length === 0) {
        delete next[foodId];
      } else {
        next[foodId] = newDraft;
      }
      return next;
    });
  }, [filteredData]);

  const handleSaveBatch = useCallback(async (restaurantId: number, foods: AdminFoodItem[]) => {
    const foodIds = foods.map((f) => f.id);
    const updates = foodIds
      .filter((id) => draftUpdates[id] !== undefined)
      .map((id) => ({
        id,
        ...draftUpdates[id],
      }));

    if (updates.length === 0) return;

    if (actions.handleBatchUpdate) {
      const success = await actions.handleBatchUpdate(updates);
      if (success) {
        setDraftUpdates((prev) => {
          const next = { ...prev };
          foodIds.forEach((id) => {
            delete next[id];
          });
          return next;
        });
      }
    }
  }, [draftUpdates, actions]);

  const handleCancelBatch = useCallback((restaurantId: number, foods: AdminFoodItem[]) => {
    const foodIds = foods.map((f) => f.id);
    setDraftUpdates((prev) => {
      const next = { ...prev };
      foodIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }, []);

  const handleDeselectAll = useCallback((foods: AdminFoodItem[]) => {
    setDraftUpdates((prev) => {
      const next = { ...prev };
      foods.forEach((food) => {
        if (food.status === UserStatus.APPROVED) {
          const originalToday = !!food.isFeaturedToday;
          const originalWeekly = !!food.isFeaturedWeekly;
          const originalRecommend = !!food.isAdminRecommended;

          const isDifferent = originalToday || originalWeekly || originalRecommend;

          if (isDifferent) {
            next[food.id] = {
              isFeaturedToday: false,
              isFeaturedWeekly: false,
              isAdminRecommended: false,
            };
          } else {
            delete next[food.id];
          }
        }
      });
      return next;
    });
  }, []);

  const handleSaveAllBatch = useCallback(async () => {
    const updates = Object.keys(draftUpdates).map((idStr) => {
      const id = parseInt(idStr, 10);
      return {
        id,
        ...draftUpdates[id],
      };
    });

    if (updates.length === 0) return;

    if (actions.handleBatchUpdate) {
      const success = await actions.handleBatchUpdate(updates);
      if (success) {
        setDraftUpdates({});
      }
    }
  }, [draftUpdates, actions]);

  const handleCancelAllBatch = useCallback(() => {
    setDraftUpdates({});
  }, []);

  return {
    expandedMerchants,
    restaurantPages,
    setRestaurantPages,
    draftUpdates,
    setDraftUpdates,
    groupedMerchantFoods,
    toggleMerchant,
    handleToggleDraft,
    handleSaveBatch,
    handleCancelBatch,
    handleDeselectAll,
    handleSaveAllBatch,
    handleCancelAllBatch,
  };
};
