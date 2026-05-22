/**
 * Mục đích file này để làm gì: Component Bảng hiển thị danh sách các món ăn của nhà hàng.
 * Các file khác hay file này có ý nghĩa như nào: Được sử dụng ở trang quản lý (Dashboard) của nhà hàng để liệt kê thực đơn, kèm theo trạng thái phê duyệt.
 * Các chức năng đặc biệt: Hiển thị giao diện danh sách bảng, hỗ trợ các nút thao tác nhanh (Chỉnh sửa, Xóa).
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';

export interface MenuFoodItem {
  id: number;
  name: string;
  image?: string;
  price?: number;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
  [key: string]: unknown;
}

interface MenuTableProps {
  myFoods: MenuFoodItem[];
  loading: boolean;
  actions: {
    onEdit: (food: MenuFoodItem) => void;
    onDelete: (id: number) => void;
  };
}

export const MenuTable = ({ myFoods, loading, actions }: MenuTableProps) => {
  return (
    <div className="card-container overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{LABELS.RESTAURANT.TABLE.FOOD}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.STATUS}</th>
            <th className="px-8 py-5 font-bold text-center">{LABELS.RESTAURANT.TABLE.ACTION}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-bold">{LABELS.COMMON.LOADING}</td></tr>
          ) : myFoods.map((food) => (
            <tr key={food.id} className="hover:bg-gray-50/50 transition-all text-body">
              <td className="px-8 py-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <Image 
                      src={getValidImageUrl(food.image)} 
                      alt={food.name} 
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-lg block">{food.name}</span>
                    <span className="text-primary font-bold">{formatCurrency(food.price)}</span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`badge-status ${
                  food.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                  food.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'
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
  );
};
