/**
 * Mục đích file này để làm gì: Component Bảng hiển thị danh sách các món ăn của nhà hàng.
 * Các file khác hay file này có ý nghĩa như nào: Được sử dụng ở trang quản lý (Dashboard) của nhà hàng để liệt kê thực đơn, kèm theo trạng thái phê duyệt.
 * Các chức năng đặc biệt: Hiển thị giao diện danh sách bảng, hỗ trợ các nút thao tác nhanh (Chỉnh sửa, Xóa).
 */
'use client';

import React from 'react';
import SafeImage from '@/components/base/SafeImage';
import { CheckCircle, Clock, XCircle, Edit, Trash2, Plus, FileUp } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';

import { Food } from '@/types/food';

export type MenuFoodItem = Food;

interface MenuTableProps {
  myFoods: MenuFoodItem[];
  loading: boolean;
  actions: {
    onEdit: (food: MenuFoodItem) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
    onUploadExcel: () => void;
  };
}

export const MenuTable = ({ myFoods, loading, actions }: MenuTableProps) => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            {LABELS.RESTAURANT.MENU_MANAGEMENT}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {LABELS.RESTAURANT.MENU_MANAGEMENT_DESC}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={actions.onUploadExcel} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/20">
            <Plus size={20} className="mr-2" /> {LABELS.RESTAURANT.UPLOAD_EXCEL.TITLE}
          </Button>
          <Button onClick={actions.onAdd}>
            <Plus size={24} className="mr-2" /> {LABELS.RESTAURANT.ADD_FOOD}
          </Button>
        </div>
      </header>

      <div className="card-container overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{LABELS.RESTAURANT.TABLE.FOOD}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.STATUS}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-bold">{LABELS.COMMON.LOADING}</td></tr>
          ) : myFoods.map((food) => (
            <tr key={food.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-body text-gray-800 dark:text-slate-200">
              <td className="px-8 py-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <SafeImage 
                      src={getValidImageUrl(food.image)} 
                      alt={food.name} 
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 dark:text-slate-100 text-lg block">{food.name}</span>
                    <span className="text-primary font-bold">{formatCurrency(food.price)}</span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`badge-status ${
                  food.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' : 
                  food.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' : 'bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'
                }`}>
                  {food.status === 'APPROVED' ? <CheckCircle size={14} /> : food.status === 'PENDING' ? <Clock size={14} /> : <XCircle size={14} />} {food.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => actions.onEdit(food)} className="text-blue-600" aria-label={LABELS.COMMON.EDIT}><Edit size={18} /></Button>
                  <Button variant="outline" size="sm" onClick={() => actions.onDelete(food.id)} className="text-red-600" aria-label={LABELS.COMMON.DELETE}><Trash2 size={18} /></Button>
                </div>
              </td>
            </tr>
          ))}
          {myFoods.length === 0 && !loading && (
            <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400">{LABELS.RESTAURANT.NO_FOOD}</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
};
