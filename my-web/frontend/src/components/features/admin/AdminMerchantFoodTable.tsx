'use client';

// Mục đích file này để làm gì: Hiển thị bảng danh sách món ăn của các nhà hàng đối tác (Merchant) được gom nhóm theo nhà hàng.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable phục vụ tab "Đối tác" trong Quản lý thực đơn.
// Các chức năng đặc biệt: Gom nhóm món ăn theo nhà hàng, lưu nháp batch update, phân trang cấp nhà hàng (cấp ngoài cùng) và phân trang món ăn bên trong mỗi nhà hàng.
// Các biến, hàm đặc biệt trong file: AdminMerchantFoodTable.

import React, { useState, useMemo, useCallback } from 'react';
import { Check, X, Star, Sparkles, Settings, Trash2, Clock, XCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { AdminTableItem } from './AdminTable';
import { FoodBatchUpdateInput } from '@/services/food.service';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';
import { UserStatus } from '@/types/user';

interface AdminMerchantFoodTableProps {
  filteredData: AdminTableItem[];
  actions: {
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    openEditModal: (food: AdminTableItem) => void;
    handleApproveFood?: (id: number, status: string) => void;
    handleToggleWeeklyFeatured?: (id: number, value: boolean) => void;
    handleBatchUpdate?: (updates: FoodBatchUpdateInput[]) => Promise<boolean>;
  };
}

const PAGE_SIZE = 5;
const RESTAURANT_PAGE_SIZE = 5;

export const AdminMerchantFoodTable = ({
  filteredData,
  actions,
}: AdminMerchantFoodTableProps) => {
  const colSpan = 5;

  // --- States ---
  const [expandedMerchants, setExpandedMerchants] = useState<number[]>([]);
  const [restaurantPages, setRestaurantPages] = useState<Record<number, number>>({});
  const [draftUpdates, setDraftUpdates] = useState<Record<number, { isFeaturedToday?: boolean; isFeaturedWeekly?: boolean; isAdminRecommended?: boolean }>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // --- Memoized Grouping ---
  const groupedMerchantFoods = useMemo(() => {
    const grouped: {
      restaurantId: number;
      restaurantName: string;
      foods: AdminTableItem[];
    }[] = [];

    filteredData.forEach((item) => {
      const rId = item.restaurantId ?? -1;
      let group = grouped.find((g) => g.restaurantId === rId);
      if (!group) {
        group = {
          restaurantId: rId,
          restaurantName: (item.restaurant?.name as string) || LABELS.COMMON.UNKNOWN,
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

  const totalRestaurantPages = Math.ceil(groupedMerchantFoods.length / RESTAURANT_PAGE_SIZE);
  const activeRestaurantPage = Math.min(Math.max(1, currentPage), totalRestaurantPages || 1);

  const paginatedRestaurants = useMemo(() => {
    const start = (activeRestaurantPage - 1) * RESTAURANT_PAGE_SIZE;
    return groupedMerchantFoods.slice(start, start + RESTAURANT_PAGE_SIZE);
  }, [groupedMerchantFoods, activeRestaurantPage]);

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

  const handleSaveBatch = useCallback(async (restaurantId: number, foods: AdminTableItem[]) => {
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

  const handleCancelBatch = useCallback((restaurantId: number, foods: AdminTableItem[]) => {
    const foodIds = foods.map((f) => f.id);
    setDraftUpdates((prev) => {
      const next = { ...prev };
      foodIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }, []);

  return (
    <div className="card-container overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.FOOD_NAME}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.SOURCE}</th>
            <th className="px-8 py-5 font-bold">{LABELS.ADMIN.TABLE.PRICE}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.STATUS}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.ADMIN.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-body">
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-8 py-12 text-center text-gray-400">
                {LABELS.ADMIN.TABLE.EMPTY}
              </td>
            </tr>
          ) : (
            paginatedRestaurants.map((group) => {
              const rId = group.restaurantId;
              const isExpanded = expandedMerchants.includes(rId);
              const foods = group.foods;
              const hasPending = foods.some((f) => f.status === UserStatus.PENDING);

              const currentPage = restaurantPages[rId] || 1;
              const totalPages = Math.ceil(foods.length / PAGE_SIZE);
              const startIndex = (currentPage - 1) * PAGE_SIZE;
              const paginatedFoods = foods.slice(startIndex, startIndex + PAGE_SIZE);

              const restaurantFoodIds = foods.map((f) => f.id);
              const hasDraftChanges = restaurantFoodIds.some((id) => draftUpdates[id] !== undefined);

              return (
                <React.Fragment key={rId}>
                  {/* Restaurant Accordion Header */}
                  <tr
                    className="bg-gray-50/80 dark:bg-slate-800/80 border-y border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => toggleMerchant(rId)}
                  >
                    <td
                      colSpan={colSpan}
                      className="px-8 py-3 font-bold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span>{group.restaurantName}</span>
                        {hasPending && (
                          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            {LABELS.ADMIN.PENDING_APPROVAL}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Food Items list for this restaurant */}
                  {isExpanded &&
                    paginatedFoods.map((item) => {
                      const draft = draftUpdates[item.id] || {};
                      const isFeaturedToday = draft.isFeaturedToday !== undefined ? draft.isFeaturedToday : item.isFeaturedToday;
                      const isFeaturedWeekly = draft.isFeaturedWeekly !== undefined ? draft.isFeaturedWeekly : item.isFeaturedWeekly;
                      const isAdminRecommended = draft.isAdminRecommended !== undefined ? draft.isAdminRecommended : item.isAdminRecommended;

                      const isModified =
                        draft.isFeaturedToday !== undefined ||
                        draft.isFeaturedWeekly !== undefined ||
                        draft.isAdminRecommended !== undefined;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/50 transition-all ${isModified ? 'bg-orange-50/30' : ''}`}
                        >
                          <td className="px-8 py-6 font-bold text-gray-800">
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                              {isModified && (
                                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                                  {LABELS.ADMIN.TABLE.DRAFT}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-gray-600 font-medium">
                            {item.restaurant?.name || LABELS.FOOD.SYSTEM}
                          </td>
                          <td className="px-8 py-6 text-gray-500">{formatCurrency(item.price)}</td>
                          <td className="px-8 py-6 text-center">
                            <span
                              className={`badge-status ${item.status === UserStatus.APPROVED
                                  ? 'bg-green-50 text-green-600 border-green-100'
                                  : item.status === UserStatus.PENDING
                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                    : 'bg-red-50 text-red-600 border-red-100'
                                }`}
                            >
                              {item.status === UserStatus.APPROVED ? (
                                <CheckCircle size={14} />
                              ) : item.status === UserStatus.PENDING ? (
                                <Clock size={14} />
                              ) : (
                                <XCircle size={14} />
                              )}{' '}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-2">
                              <div className="flex gap-2">
                                {item.status !== UserStatus.APPROVED && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => actions.handleApproveFood?.(item.id, UserStatus.APPROVED)}
                                    className="!bg-green-50 !text-green-600 hover:!bg-green-600 hover:!text-white !border-none p-2 rounded-xl"
                                    aria-label={LABELS.COMMON.APPROVE}
                                    title={LABELS.COMMON.APPROVE}
                                  >
                                    <Check size={18} />
                                  </Button>
                                )}
                                {item.status !== UserStatus.REJECTED && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => actions.handleApproveFood?.(item.id, UserStatus.REJECTED)}
                                    className="!bg-red-50 !text-red-600 hover:!bg-red-600 hover:!text-white !border-none p-2 rounded-xl"
                                    aria-label={LABELS.COMMON.REJECT}
                                    title={LABELS.COMMON.REJECT}
                                  >
                                    <X size={18} />
                                  </Button>
                                )}

                                {item.status === UserStatus.APPROVED && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleDraft(item.id, 'isFeaturedToday', !!isFeaturedToday)}
                                      className={isFeaturedToday ? '!bg-orange-500 !text-white !border-none' : ''}
                                      aria-label={LABELS.ADMIN.TABLE.FEATURE_TODAY}
                                      title={LABELS.ADMIN.TABLE.FEATURE_TODAY}
                                    >
                                      <Star size={18} fill={isFeaturedToday ? 'white' : 'none'} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleDraft(item.id, 'isFeaturedWeekly', !!isFeaturedWeekly)}
                                      className={isFeaturedWeekly ? '!bg-purple-500 !text-white !border-none' : ''}
                                      aria-label={LABELS.ADMIN.TABLE.FEATURE_WEEKLY}
                                      title={LABELS.ADMIN.TABLE.FEATURE_WEEKLY}
                                    >
                                      <Sparkles size={18} fill={isFeaturedWeekly ? 'white' : 'none'} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleToggleDraft(item.id, 'isAdminRecommended', !!isAdminRecommended)
                                      }
                                      className={isAdminRecommended ? '!bg-primary !text-white !border-none' : ''}
                                      aria-label={LABELS.ADMIN.TABLE.ADMIN_RECOMMEND}
                                      title={LABELS.ADMIN.TABLE.ADMIN_RECOMMEND}
                                    >
                                      <Sparkles size={18} fill={isAdminRecommended ? 'white' : 'none'} />
                                    </Button>
                                  </>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actions.openEditModal(item)}
                                  className="text-blue-600"
                                  aria-label={LABELS.COMMON.EDIT}
                                >
                                  <Settings size={18} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actions.handleDeleteFood(item.id)}
                                  className="text-red-600"
                                  aria-label={LABELS.COMMON.DELETE}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {/* Pagination and Batch Save/Cancel UI */}
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={colSpan}
                        className="px-8 py-4 bg-gray-50/30 border-b border-gray-100 dark:border-slate-800"
                      >
                        <div className="flex justify-between items-center w-full">
                          {/* Left: Pagination */}
                          <div>
                            {totalPages > 1 ? (
                              <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setRestaurantPages((prev) => ({ ...prev, [rId]: page }))}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">
                                {LABELS.ADMIN.TABLE.SHOWING_FOODS(foods.length)}
                              </span>
                            )}
                          </div>

                          {/* Right: Save & Cancel Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!hasDraftChanges}
                              onClick={() => handleSaveBatch(rId, foods)}
                              className="h-8 py-1 rounded-xl shadow-none"
                            >
                              {LABELS.ADMIN.BATCH_SAVE}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasDraftChanges}
                              onClick={() => handleCancelBatch(rId, foods)}
                              className="h-8 py-1 rounded-xl border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                            >
                              {LABELS.ADMIN.BATCH_CANCEL}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
          {totalRestaurantPages > 1 && (
            <tr>
              <td
                colSpan={colSpan}
                className="px-8 py-4 bg-gray-50/30 border-b border-gray-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-gray-400 font-bold">
                    {LABELS.ADMIN.TABLE.SHOWING_RESTAURANTS(groupedMerchantFoods.length)}
                  </span>
                  <Pagination
                    currentPage={activeRestaurantPage}
                    totalPages={totalRestaurantPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
