'use client';

// Mục đích file này để làm gì: Hiển thị danh sách món ăn của các nhà hàng đối tác (Merchant) được gom nhóm theo nhà hàng dưới dạng dòng trực quan.
// Các file khác hay file này có ý nghĩa như nào: Component con của AdminTable phục vụ tab "Đối tác" trong Quản lý thực đơn.
// Các chức năng đặc biệt: Gom nhóm món ăn theo nhà hàng, lưu nháp batch update, phân trang cấp nhà hàng (cấp ngoài cùng) và phân trang món ăn bên trong mỗi nhà hàng.
// Các chế độ hiển thị mới: Tích hợp chế độ lọc xem (Tất cả, Đề xuất, Chưa đề xuất) và chế độ Chỉnh sửa riêng lẻ của từng nhà hàng.

import React, { useState, useMemo } from 'react';
import { Check, X, Star, Sparkles, Settings, Trash2, Clock, XCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Pagination } from '@/components/base/Pagination';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { AdminFoodItem } from '@/types/food';
import { FoodBatchUpdateInput } from '@/services/food.service';
import { UpdateFoodPayload } from '@/hooks/useAdminActions';
import { UserStatus } from '@/types/user';
import { MiniCardForAdmin } from './MiniCardForAdmin';
import { useMerchantFoodTable } from '@/hooks/useMerchantFoodTable';
import { ConfirmModal } from '@/components/base/ConfirmModal';

interface AdminMerchantFoodTableProps {
  filteredData: AdminFoodItem[];
  actions: {
    handleUpdateFood: (id: number, data: UpdateFoodPayload) => void;
    handleRecommendFood: (id: number, newValue: boolean) => void;
    handleDeleteFood: (id: number) => void;
    openEditModal: (food: any) => void;
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
  const [currentPage, setCurrentPage] = useState(1);

  // --- Quản lý trạng thái chế độ Chỉnh sửa (Edit Mode) & Bộ lọc Xem của từng nhà hàng ---
  const [editModeRestaurants, setEditModeRestaurants] = useState<number[]>([]);
  const [restaurantFilters, setRestaurantFilters] = useState<Record<number, 'all' | 'recommended' | 'unrecommended'>>({});

  // --- Quản lý trạng thái các modal xác nhận ---
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ foodId: number; foodName: string; status: string } | null>(null);

  // --- Tích hợp Custom Hook đóng gói toàn bộ logic phức tạp ---
  const {
    expandedMerchants,
    restaurantPages,
    setRestaurantPages,
    draftUpdates,
    groupedMerchantFoods,
    toggleMerchant,
    handleToggleDraft,
    handleDeselectAll,
    handleSaveAllBatch,
    handleCancelAllBatch,
  } = useMerchantFoodTable({ filteredData, actions });

  // --- Cấu hình modal xác nhận phê duyệt/từ chối món ăn giúp thu gọn code JSX ---
  const statusChangeModalConfig = useMemo(() => {
    if (!pendingStatusChange) return null;
    const isApprove = pendingStatusChange.status === UserStatus.APPROVED;
    return {
      title: isApprove ? LABELS.ADMIN.CONFIRM.APPROVE_FOOD : LABELS.ADMIN.CONFIRM.REJECT_FOOD,
      message: isApprove 
        ? LABELS.ADMIN.CONFIRM.APPROVE_FOOD_DESC(pendingStatusChange.foodName)
        : LABELS.ADMIN.CONFIRM.REJECT_FOOD_DESC(pendingStatusChange.foodName),
      confirmText: isApprove ? LABELS.COMMON.APPROVE : LABELS.COMMON.REJECT,
      variant: isApprove ? ('info' as const) : ('danger' as const),
    };
  }, [pendingStatusChange]);

  const totalRestaurantPages = Math.ceil(groupedMerchantFoods.length / RESTAURANT_PAGE_SIZE);
  const activeRestaurantPage = Math.min(Math.max(1, currentPage), totalRestaurantPages || 1);

  const paginatedRestaurants = useMemo(() => {
    const start = (activeRestaurantPage - 1) * RESTAURANT_PAGE_SIZE;
    return groupedMerchantFoods.slice(start, start + RESTAURANT_PAGE_SIZE);
  }, [groupedMerchantFoods, activeRestaurantPage]);

  return (
    <div className="space-y-6 pb-24"> {/* Thêm pb-24 để tránh bị đè bởi banner nổi phía dưới */}
      {filteredData.length === 0 ? (
        <div className="card-container p-12 text-center text-gray-400 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          {LABELS.ADMIN.TABLE.EMPTY}
        </div>
      ) : (
        paginatedRestaurants.map((group: { restaurantId: number; restaurantName: string; foods: AdminFoodItem[] }) => {
          const rId = group.restaurantId;
          const isExpanded = expandedMerchants.includes(rId);
          const foods = group.foods;
          const hasPending = foods.some((f: AdminFoodItem) => f.status === UserStatus.PENDING);

          const curPage = restaurantPages[rId] || 1;
          const currentFilter = restaurantFilters[rId] || 'all';
          const isEditing = editModeRestaurants.includes(rId);

          // Lọc danh sách món ăn theo chế độ Xem (Tất cả, Đề xuất, Chưa đề xuất) dựa trên giá trị gốc từ DB để tránh biến mất món ăn khi đang chỉnh sửa nháp
          const filteredFoodsOfRestaurant = foods.filter((item) => {
            const isOriginalRecommended = !!(item.isFeaturedToday || item.isFeaturedWeekly || item.isAdminRecommended);

            if (currentFilter === 'recommended') return isOriginalRecommended;
            if (currentFilter === 'unrecommended') return !isOriginalRecommended;
            return true;
          });

          const totalPages = Math.ceil(filteredFoodsOfRestaurant.length / PAGE_SIZE);
          const startIndex = (curPage - 1) * PAGE_SIZE;
          const paginatedFoods = filteredFoodsOfRestaurant.slice(startIndex, startIndex + PAGE_SIZE);

          return (
            <div 
              key={`g-grid-${rId}`}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              {/* Restaurant Row Header */}
              <div 
                className="flex justify-between items-center cursor-pointer hover:opacity-85 select-none"
                onClick={() => toggleMerchant(rId)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                  <span className="font-extrabold text-gray-800 dark:text-slate-200 text-base">{group.restaurantName}</span>
                  {hasPending && (
                    <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1 h-1 rounded-full bg-red-600 animate-pulse"></span>
                      {LABELS.ADMIN.PENDING_APPROVAL}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {foods.length} {LABELS.RESTAURANT.CARD_LABELS.FOODS_SUFFIX}
                </span>
              </div>

              {/* Expanded Foods Grid */}
              {isExpanded && (
                <div className="pt-3 border-t border-gray-50 dark:border-slate-800/50 space-y-4">
                  {/* Actions Header bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 px-1 pb-3 border-b border-gray-50 dark:border-slate-800/30">
                    <span className="text-xs text-gray-400 font-bold">
                      {LABELS.ADMIN.TABLE.SHOWING_FOODS(filteredFoodsOfRestaurant.length)}
                    </span>
                    
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      {/* VIEW MENU dropdown */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold bg-gray-50 dark:bg-slate-800/50 py-1.5 px-3 rounded-xl border border-gray-100 dark:border-slate-800">
                        <span>{LABELS.ADMIN.VIEW_MODE_LABEL}:</span>
                        <select
                          value={currentFilter}
                          onChange={(e) => {
                            const newFilter = e.target.value as 'all' | 'recommended' | 'unrecommended';
                            setRestaurantFilters(prev => ({ ...prev, [rId]: newFilter }));
                            // Khi chọn Xem lọc, tự động tắt chế độ Chỉnh sửa nếu đang bật
                            setEditModeRestaurants(prev => prev.filter(id => id !== rId));
                          }}
                          className="bg-transparent font-bold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="all" className="bg-white dark:bg-slate-900">{LABELS.ADMIN.FILTER_ALL}</option>
                          <option value="recommended" className="bg-white dark:bg-slate-900">{LABELS.ADMIN.FILTER_RECOMMENDED}</option>
                          <option value="unrecommended" className="bg-white dark:bg-slate-900">{LABELS.ADMIN.FILTER_UNRECOMMENDED}</option>
                        </select>
                      </div>

                      {/* EDIT/DESELECT ALL buttons */}
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModeRestaurants(prev => [...prev, rId]);
                          }}
                          className="text-xs h-8 py-0 px-3.5 rounded-xl border-gray-200 text-gray-700 hover:text-primary hover:border-primary font-bold transition-all"
                        >
                          {LABELS.ADMIN.EDIT_MODE_LABEL}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeselectAll(foods);
                            }}
                            className="text-xs h-8 py-0 px-3.5 rounded-xl border-red-100 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold transition-all"
                          >
                            {LABELS.ADMIN.DESELECT_ALL}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditModeRestaurants(prev => prev.filter(id => id !== rId));
                            }}
                            className="text-xs h-8 py-0 px-3 rounded-xl font-bold"
                          >
                            {LABELS.ADMIN.DONE}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {filteredFoodsOfRestaurant.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl">
                      {LABELS.ADMIN.TABLE.EMPTY}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {paginatedFoods.map((item: AdminFoodItem) => {
                        const draft = draftUpdates[item.id] || {};
                        const isFeaturedToday = draft.isFeaturedToday !== undefined ? draft.isFeaturedToday : item.isFeaturedToday;
                        const isFeaturedWeekly = draft.isFeaturedWeekly !== undefined ? draft.isFeaturedWeekly : item.isFeaturedWeekly;
                        const isAdminRecommended = draft.isAdminRecommended !== undefined ? draft.isAdminRecommended : item.isAdminRecommended;

                        const isModified =
                          draft.isFeaturedToday !== undefined ||
                          draft.isFeaturedWeekly !== undefined ||
                          draft.isAdminRecommended !== undefined;

                        const cardActions = isEditing ? [
                          // Nút duyệt nhanh
                          ...(item.status !== UserStatus.APPROVED ? [{
                            label: LABELS.COMMON.APPROVE,
                            icon: <Check size={16} />,
                            onClick: (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setPendingStatusChange({
                                foodId: item.id,
                                foodName: item.name,
                                status: UserStatus.APPROVED
                              });
                            },
                            variant: 'success' as const,
                            title: LABELS.COMMON.APPROVE
                          }] : []),
                          // Nút từ chối nhanh
                          ...(item.status !== UserStatus.REJECTED ? [{
                            label: LABELS.COMMON.REJECT,
                            icon: <X size={16} />,
                            onClick: (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setPendingStatusChange({
                                foodId: item.id,
                                foodName: item.name,
                                status: UserStatus.REJECTED
                              });
                            },
                            variant: 'danger' as const,
                            title: LABELS.COMMON.REJECT
                          }] : []),
                          // Nút nổi bật nháp khi đã duyệt
                          ...(item.status === UserStatus.APPROVED ? [
                            {
                              label: LABELS.ADMIN.TABLE.FEATURE_TODAY,
                              icon: <Star size={16} fill={isFeaturedToday ? 'white' : 'none'} />,
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleDraft(item.id, 'isFeaturedToday', !!isFeaturedToday);
                              },
                              active: !!isFeaturedToday,
                              variant: 'primary' as const,
                              title: LABELS.ADMIN.TABLE.FEATURE_TODAY
                            },
                            {
                              label: LABELS.ADMIN.TABLE.FEATURE_WEEKLY,
                              icon: <Sparkles size={16} fill={isFeaturedWeekly ? 'white' : 'none'} />,
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleDraft(item.id, 'isFeaturedWeekly', !!isFeaturedWeekly);
                              },
                              active: !!isFeaturedWeekly,
                              variant: 'purple' as const,
                              title: LABELS.ADMIN.TABLE.FEATURE_WEEKLY
                            },
                            {
                              label: LABELS.ADMIN.TABLE.ADMIN_RECOMMEND,
                              icon: <Sparkles size={16} fill={isAdminRecommended ? 'white' : 'none'} />,
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleDraft(item.id, 'isAdminRecommended', !!isAdminRecommended);
                              },
                              active: !!isAdminRecommended,
                              variant: 'secondary' as const,
                              title: LABELS.ADMIN.TABLE.ADMIN_RECOMMEND
                            }
                          ] : []),
                          // Sửa và xóa
                          {
                            label: LABELS.COMMON.EDIT,
                            icon: <Settings size={16} />,
                            onClick: (e: React.MouseEvent) => {
                              e.stopPropagation();
                              actions.openEditModal(item);
                            },
                            variant: 'ghost' as const,
                            title: LABELS.COMMON.EDIT
                          },
                          {
                            label: LABELS.COMMON.DELETE,
                            icon: <Trash2 size={16} />,
                            onClick: (e: React.MouseEvent) => {
                              e.stopPropagation();
                              actions.handleDeleteFood(item.id);
                            },
                            variant: 'danger' as const,
                            title: LABELS.COMMON.DELETE
                          }
                        ] : [];

                        const metaBadges: Array<{
                          label: string | React.ReactNode;
                          type?: 'primary' | 'secondary' | 'success' | 'danger' | 'neutral' | 'purple';
                        }> = [
                          { 
                            label: item.status, 
                            type: item.status === UserStatus.APPROVED 
                              ? 'success' as const 
                              : item.status === UserStatus.PENDING 
                              ? 'primary' as const 
                              : 'danger' as const 
                          },
                          { label: formatCurrency(item.price), type: 'primary' as const }
                        ];
                        
                        // Trong chế độ View (Không chỉnh sửa), hiển thị trực quan các cờ đề xuất hiện tại của món ăn
                        if (!isEditing) {
                          if (isFeaturedToday) {
                            metaBadges.push({ label: LABELS.ADMIN.TABLE.FEATURE_TODAY, type: 'primary' as const });
                          }
                          if (isFeaturedWeekly) {
                            metaBadges.push({ label: LABELS.ADMIN.TABLE.FEATURE_WEEKLY, type: 'purple' as const });
                          }
                          if (isAdminRecommended) {
                            metaBadges.push({ label: LABELS.ADMIN.TABLE.ADMIN_RECOMMEND, type: 'secondary' as const });
                          }
                        }

                        if (isModified) {
                          metaBadges.unshift({ label: LABELS.ADMIN.TABLE.DRAFT, type: 'purple' as const });
                        }

                        return (
                          <MiniCardForAdmin
                            key={item.id}
                            id={item.id}
                            title={item.name}
                            subtitle={item.description || LABELS.FOOD.NO_DESCRIPTION}
                            image={item.image}
                            meta={metaBadges}
                            actions={cardActions}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination and footer for expanded restaurant */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center w-full pt-4 border-t border-gray-50 dark:border-slate-800/30">
                      <div>
                        <Pagination
                          currentPage={curPage}
                          totalPages={totalPages}
                          onPageChange={(page) => setRestaurantPages((prev) => ({ ...prev, [rId]: page }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {totalRestaurantPages > 1 && (
        <div className="card-container px-8 py-4 flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          <span className="text-xs text-gray-400 font-bold">
            {LABELS.ADMIN.TABLE.SHOWING_RESTAURANTS(groupedMerchantFoods.length)}
          </span>
          <Pagination
            currentPage={activeRestaurantPage}
            totalPages={totalRestaurantPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Sticky global save banner when there are any draft updates */}
      {Object.keys(draftUpdates).length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-80 md:right-12 z-50 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
              {LABELS.ADMIN.UNSAVED_CHANGES(Object.keys(draftUpdates).length)}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDiscardConfirm(true)}
              className="w-full md:w-auto px-5 py-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold"
            >
              {LABELS.ADMIN.BATCH_CANCEL_ALL}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowSaveConfirm(true)}
              className="w-full md:w-auto px-6 py-2 shadow-lg shadow-orange-500/20 font-bold"
            >
              {LABELS.ADMIN.BATCH_SAVE_ALL}
            </Button>
          </div>
        </div>
      )}

      {/* Modal xác nhận lưu thay đổi hàng loạt */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        title={LABELS.ADMIN.CONFIRM.BATCH_SAVE}
        message={LABELS.ADMIN.CONFIRM.BATCH_SAVE_DESC}
        onConfirm={async () => {
          await handleSaveAllBatch();
          setShowSaveConfirm(false);
        }}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText={LABELS.ADMIN.BATCH_SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="info"
      />

      {/* Modal xác nhận hủy thay đổi hàng loạt */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title={LABELS.ADMIN.CONFIRM.BATCH_DISCARD}
        message={LABELS.ADMIN.CONFIRM.BATCH_DISCARD_DESC}
        onConfirm={() => {
          handleCancelAllBatch();
          setShowDiscardConfirm(false);
          setEditModeRestaurants([]);
        }}
        onCancel={() => setShowDiscardConfirm(false)}
        confirmText={LABELS.ADMIN.BATCH_CANCEL}
        cancelText={LABELS.COMMON.CANCEL}
        variant="danger"
      />

      {/* Modal xác nhận phê duyệt hoặc từ chối món ăn */}
      {statusChangeModalConfig && pendingStatusChange && (
        <ConfirmModal
          isOpen={true}
          title={statusChangeModalConfig.title}
          message={statusChangeModalConfig.message}
          onConfirm={async () => {
            if (actions.handleApproveFood) {
              await actions.handleApproveFood(pendingStatusChange.foodId, pendingStatusChange.status);
            }
            setPendingStatusChange(null);
          }}
          onCancel={() => setPendingStatusChange(null)}
          confirmText={statusChangeModalConfig.confirmText}
          cancelText={LABELS.COMMON.CANCEL}
          variant={statusChangeModalConfig.variant}
        />
      )}
    </div>
  );
};
