'use client';

import React, { useState } from 'react';
import { Check, X, Star, Sparkles, Settings, Trash2, Clock, XCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface AdminTableProps {
  activeTab: string;
  foodSubTab?: 'system' | 'merchant';
  loading: boolean;
  filteredData: any[];
  actions: {
    handleUpdateStatus: (id: any, status: string) => void;
    handleUpdateFood: (id: any, data: any) => void;
    handleRecommendFood: (id: any) => void;
    handleDeleteFood: (id: any) => void;
    handleDeleteUser: (id: any) => void;
    openEditModal: (food: any) => void;
    handleApproveFood?: (id: any, status: string) => void;
    handleToggleWeeklyFeatured?: (id: any, value: boolean) => void;
  };
}

export const AdminTable = ({
  activeTab,
  foodSubTab,
  loading,
  filteredData,
  actions
}: AdminTableProps) => {
  const isMerchantMenu = activeTab === 'menu' && foodSubTab === 'merchant';
  const colSpan = isMerchantMenu ? 5 : 4;

  const [expandedMerchants, setExpandedMerchants] = useState<number[]>([]);

  const toggleMerchant = (id: number) => {
    setExpandedMerchants(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="card-container overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">
              {activeTab === 'menu' ? LABELS.ADMIN.TABLE.FOOD_NAME : LABELS.ADMIN.TABLE.NAME}
            </th>
            <th className="px-8 py-5 font-bold">
              {activeTab === 'menu' ? LABELS.ADMIN.TABLE.SOURCE : LABELS.ADMIN.TABLE.EMAIL}
            </th>
            <th className="px-8 py-5 font-bold">
              {activeTab === 'menu' ? LABELS.ADMIN.TABLE.PRICE : LABELS.ADMIN.TABLE.DATE}
            </th>
            {isMerchantMenu && (
              <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.STATUS}</th>
            )}
            <th className="px-8 py-5 font-bold text-center">{LABELS.ADMIN.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-body">
          {loading ? (
            <tr><td colSpan={colSpan} className="px-8 py-12 text-center text-gray-400">{LABELS.COMMON.LOADING}</td></tr>
          ) : filteredData.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-8 py-12 text-center text-gray-400">{LABELS.ADMIN.TABLE.EMPTY}</td></tr>
          ) : (
            filteredData.map((item: Record<string, unknown> & { id: number; name: string; email?: string; price?: number; createdAt: string; status: string; isFeaturedToday?: boolean; isFeaturedWeekly?: boolean; isAdminRecommended?: boolean; restaurantId?: number; restaurant?: { name: string } }, index: number) => {
              const prevItem = index > 0 ? filteredData[index - 1] : null;
              // So sánh theo restaurantId vì Prisma backend chỉ select { name: true } cho nested restaurant
              const isNewMerchant = isMerchantMenu && (!prevItem || prevItem.restaurantId !== item.restaurantId);

              let hasPending = false;
              if (isNewMerchant) {
                hasPending = filteredData.some((f: any) => f.restaurantId === item.restaurantId && f.status === 'PENDING');
              }

              return (
                <React.Fragment key={item.id}>
                  {isNewMerchant && (
                    <tr 
                      className="bg-gray-50/80 dark:bg-slate-800/80 border-y border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => toggleMerchant(item.restaurantId || -1)}
                    >
                      <td colSpan={colSpan} className="px-8 py-3 font-bold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider select-none">
                        <div className="flex items-center gap-2">
                          {expandedMerchants.includes(item.restaurantId || -1) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <span>🏠 {item.restaurant?.name || LABELS.COMMON.UNKNOWN}</span>
                          {hasPending && (
                            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                              {LABELS.ADMIN.PENDING_APPROVAL}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {(!isMerchantMenu || expandedMerchants.includes(item.restaurantId || -1)) && (
                    <tr className="hover:bg-gray-50/50 transition-all">
                      <td className="px-8 py-6 font-bold text-gray-800">{item.name}</td>
                    <td className="px-8 py-6 text-gray-600 font-medium">
                      {activeTab === 'menu' ? (item.restaurant?.name || LABELS.FOOD.SYSTEM) : item.email}
                    </td>
                    <td className="px-8 py-6 text-gray-500">
                      {activeTab === 'menu' ? formatCurrency(item.price) : formatDate(item.createdAt)}
                    </td>
                    {isMerchantMenu && (
                      <td className="px-8 py-6 text-center">
                        <span className={`badge-status ${
                          item.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                          item.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {item.status === 'APPROVED' ? <CheckCircle size={14} /> : item.status === 'PENDING' ? <Clock size={14} /> : <XCircle size={14} />} {item.status}
                        </span>
                      </td>
                    )}
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-2">
                        {activeTab === 'merchants' ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => actions.handleUpdateStatus(item.id, 'APPROVED')} 
                              className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border-none p-2 rounded-xl"
                              aria-label={LABELS.COMMON.APPROVE}
                            >
                              <Check size={18} />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => actions.handleUpdateStatus(item.id, 'REJECTED')} 
                              className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-none p-2 rounded-xl"
                              aria-label={LABELS.COMMON.REJECT}
                            >
                              <X size={18} />
                            </Button>
                          </>
                        ) : activeTab === 'menu' ? (
                          <div className="flex gap-2">
                            {isMerchantMenu && item.status !== 'APPROVED' && (
                              <Button 
                                size="sm" 
                                onClick={() => actions.handleApproveFood?.(item.id, 'APPROVED')} 
                                className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border-none p-2 rounded-xl"
                                aria-label={LABELS.COMMON.APPROVE}
                                title={LABELS.COMMON.APPROVE}
                              >
                                <Check size={18} />
                              </Button>
                            )}
                            {isMerchantMenu && item.status !== 'REJECTED' && (
                              <Button 
                                size="sm" 
                                onClick={() => actions.handleApproveFood?.(item.id, 'REJECTED')} 
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-none p-2 rounded-xl"
                                aria-label={LABELS.COMMON.REJECT}
                                title={LABELS.COMMON.REJECT}
                              >
                                <X size={18} />
                              </Button>
                            )}
                            
                            {(!isMerchantMenu || item.status === 'APPROVED') && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => actions.handleUpdateFood(item.id, { isFeaturedToday: !item.isFeaturedToday })} 
                                  className={item.isFeaturedToday ? 'bg-orange-500 text-white' : ''}
                                  aria-label={LABELS.RESTAURANT.TABLE.FEATURE}
                                  title="Món ngon hôm nay"
                                >
                                  <Star size={18} fill={item.isFeaturedToday ? "white" : "none"} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => actions.handleToggleWeeklyFeatured?.(item.id, !item.isFeaturedWeekly)} 
                                  className={item.isFeaturedWeekly ? 'bg-purple-500 text-white' : ''}
                                  aria-label="Món ngon tuần"
                                  title="Món ngon tuần"
                                >
                                  <Sparkles size={18} fill={item.isFeaturedWeekly ? "white" : "none"} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => actions.handleRecommendFood(item.id)} 
                                  className={item.isAdminRecommended ? 'bg-primary text-white' : ''}
                                  aria-label={LABELS.RESTAURANT.TABLE.RECOMMEND}
                                  title="Admin khuyên dùng"
                                >
                                  <Sparkles size={18} fill={item.isAdminRecommended ? "white" : "none"} />
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
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => actions.handleDeleteUser(item.id)} 
                            className="text-red-600"
                            aria-label={LABELS.COMMON.DELETE}
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
