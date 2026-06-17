/**
 * Mục đích file này để làm gì: Component Modal để Thêm mới hoặc Chỉnh sửa món ăn.
 * Các file khác hay file này có ý nghĩa như nào: Dùng trong trang quản trị của nhà hàng hoặc admin, hiển thị form nhập liệu.
 * Các chức năng đặc biệt: Tích hợp chọn danh mục, tự động điền địa chỉ/vị trí theo cơ sở kinh doanh, tái sử dụng cho cả Thêm và Sửa.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, XCircle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { Food } from '@/types/food';
import { Restaurant } from '@/types/restaurant';

export interface FoodFormData {
  id?: number;
  name: string;
  price: string | number;
  tags: string;
  image: string;
  description: string;
  restaurantId: number | string;
  categoryId?: number | string | null;
  address?: string;
  mapUrl?: string;
  lat?: string | number;
  lng?: string | number;
  [key: string]: unknown;
}

interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFood: Food | null;
  formData: FoodFormData;
  setFormData: (data: FoodFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  myBranches: Restaurant[];
  onSelectBranch: (branchId: number) => void;
}

export const FoodFormModal = ({
  isOpen,
  onClose,
  editingFood,
  formData,
  setFormData,
  onSubmit,
  myBranches = [],
  onSelectBranch
}: FoodFormModalProps) => {
  const { categories } = usePublicCategories(formData.restaurantId);

  if (!isOpen) return null;

  // Flatten categories for select dropdown
  // Bỏ qua root category tự tạo (cùng tên group, parentId=null) - hiển thị Group là option chọn trực tiếp
  const buildFlatOptions = () => {
    const options: React.ReactNode[] = [];
    categories.forEach(group => {
      const rootCat = group.categories?.find(c => c.parentId === null && c.name === group.name);
      // Thêm Group là option chọn trực tiếp (dùng ID root category ẩn)
      if (rootCat) {
        options.push(
          <option key={`root-${rootCat.id}`} value={rootCat.id}>
            📁 {group.name}
          </option>
        );
      }
      // Thêm các sub-category (bỏ qua root caù trùng tên)
      group.categories?.forEach(cat => {
        if (!(cat.parentId === null && cat.name === group.name)) {
          options.push(
            <option key={cat.id} value={cat.id}>
                — {cat.name}
            </option>
          );
        }
      });
    });
    return options;
  };

  return (
    <div className="modal-wrapper">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-overlay"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="modal-card max-w-xl w-full relative z-10"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-h2 flex items-center gap-3">
            {editingFood ? <Edit className="text-blue-500" /> : <Plus className="text-primary" />} 
            {editingFood ? LABELS.RESTAURANT.MODAL.EDIT_TITLE : LABELS.RESTAURANT.MODAL.ADD_TITLE}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
            <XCircle size={32} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chọn Cơ sở */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">{LABELS.RESTAURANT.MODAL.BRANCH_LABEL}</label>
              <select
                required
                value={formData.restaurantId || ''}
                onChange={e => onSelectBranch(parseInt(e.target.value))}
                className="form-input py-4 px-6 rounded-2xl text-sm font-semibold"
              >
                <option value="" disabled hidden>
                  {LABELS.RESTAURANT.MODAL.BRANCH_PLACEHOLDER}
                </option>
                {myBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Danh mục */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">{LABELS.RESTAURANT.MODAL.CATEGORY_LABEL}</label>
              <select
                value={formData.categoryId || ''}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="form-input py-4 px-6 rounded-2xl text-sm font-semibold"
              >
                <option value="">{LABELS.RESTAURANT.MODAL.CATEGORY_PLACEHOLDER}</option>
                {buildFlatOptions()}
              </select>
            </div>

            <Input 
              label={LABELS.FORM.FOOD_NAME} 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="md:col-span-2" 
            />
            <Input 
              label={LABELS.FORM.PRICE} 
              type="number" 
              value={formData.price} 
              onChange={e => setFormData({ ...formData, price: e.target.value })} 
            />
            <Input 
              label={LABELS.FORM.TAGS} 
              value={formData.tags} 
              onChange={e => setFormData({ ...formData, tags: e.target.value })} 
            />
            <Input 
              label={LABELS.FORM.IMAGE_URL} 
              value={formData.image} 
              onChange={e => setFormData({ ...formData, image: e.target.value })} 
              className="md:col-span-2" 
            />
            <Input 
              label={LABELS.FORM.DESCRIPTION} 
              isTextArea 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              className="md:col-span-2" 
            />
            <Input 
              label={`${LABELS.FORM.ADDRESS} ${LABELS.RESTAURANT.MODAL.AUTO_FILL_BRANCH}`} 
              value={formData.address} 
              disabled
              className="md:col-span-2 bg-gray-100 text-gray-500 cursor-not-allowed" 
            />
            <Input 
              label={`${LABELS.FORM.MAP_URL} ${LABELS.RESTAURANT.MODAL.AUTO_FILL_BRANCH}`} 
              value={formData.mapUrl} 
              disabled
              className="md:col-span-2 bg-gray-100 text-gray-500 cursor-not-allowed" 
            />
            <Input 
              label={`${LABELS.FORM.LAT} ${LABELS.RESTAURANT.MODAL.AUTO_FILL_LAT_LNG}`} 
              type="number"
              step="any"
              value={formData.lat} 
              disabled
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <Input 
              label={`${LABELS.FORM.LNG} ${LABELS.RESTAURANT.MODAL.AUTO_FILL_LAT_LNG}`} 
              type="number"
              step="any"
              value={formData.lng} 
              disabled
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>
              {LABELS.COMMON.CANCEL}
            </Button>
            <Button type="submit" fullWidth>
              {editingFood ? LABELS.RESTAURANT.MODAL.SUBMIT_EDIT : LABELS.RESTAURANT.MODAL.SUBMIT_ADD}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
