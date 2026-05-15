'use client';

import React from 'react';
import { Check, X, Star, Sparkles, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface AdminTableProps {
  activeTab: string;
  loading: boolean;
  filteredData: any[];
  actions: {
    handleUpdateStatus: (id: any, status: string) => void;
    handleUpdateFood: (id: any, data: any) => void;
    handleRecommendFood: (id: any) => void;
    handleDeleteFood: (id: any) => void;
    handleDeleteUser: (id: any) => void;
    openEditModal: (food: any) => void;
  };
}

export const AdminTable = ({
  activeTab,
  loading,
  filteredData,
  actions
}: AdminTableProps) => {
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
            <th className="px-8 py-5 font-bold text-center">{LABELS.ADMIN.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-body">
          {loading ? (
            <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400">{LABELS.COMMON.LOADING}</td></tr>
          ) : filteredData.length === 0 ? (
            <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400">{LABELS.ADMIN.TABLE.EMPTY}</td></tr>
          ) : (
            filteredData.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                <td className="px-8 py-6 font-bold text-gray-800">{item.name}</td>
                <td className="px-8 py-6 text-gray-600 font-medium">
                  {activeTab === 'menu' ? (item.restaurant?.name || LABELS.FOOD.SYSTEM) : item.email}
                </td>
                <td className="px-8 py-6 text-gray-500">
                  {activeTab === 'menu' ? formatCurrency(item.price) : formatDate(item.createdAt)}
                </td>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => actions.handleUpdateFood(item.id, { isFeaturedToday: !item.isFeaturedToday })} 
                          className={item.isFeaturedToday ? 'bg-orange-500 text-white' : ''}
                          aria-label={LABELS.RESTAURANT.TABLE.FEATURE}
                        >
                          <Star size={18} fill={item.isFeaturedToday ? "white" : "none"} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => actions.handleRecommendFood(item.id)} 
                          className={item.isAdminRecommended ? 'bg-primary text-white' : ''}
                          aria-label={LABELS.RESTAURANT.TABLE.RECOMMEND}
                        >
                          <Sparkles size={18} fill={item.isAdminRecommended ? "white" : "none"} />
                        </Button>
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
