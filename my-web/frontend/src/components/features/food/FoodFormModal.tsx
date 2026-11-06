/**
 * Mục đích file này để làm gì: Component Modal để Thêm mới hoặc Chỉnh sửa món ăn.
 * Các file khác hay file này có ý nghĩa như nào: Dùng trong trang quản trị của nhà hàng hoặc admin, hiển thị form nhập liệu.
 * Các chức năng đặc biệt: Tích hợp chọn danh mục, tự động điền địa chỉ/vị trí theo cơ sở kinh doanh, tái sử dụng cho cả Thêm và Sửa.
 */
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, XCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { ImageUploader } from '@/components/base/ImageUploader';
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
  calories?: string | number;
  carbs?: string | number;
  protein?: string | number;
  fat?: string | number;
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

  const handleFieldChange = (key: keyof FoodFormData, value: unknown) => {
    setFormData({ ...formData, [key]: value });
  };

  const categoryOptions = useMemo(() => {
    const options: React.ReactNode[] = [];
    categories.forEach(group => {
      const rootCat = group.categories?.find(c => c.parentId === null && c.name === group.name);
      if (rootCat) {
        options.push(
          <option key={`root-${rootCat.id}`} value={rootCat.id}>
            📁 {group.name}
          </option>
        );
      }
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
  }, [categories]);

  if (!isOpen) return null;

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
          <Button onClick={onClose} variant="none" size="none" className="text-gray-400 hover:text-gray-600 transition-all">
            <XCircle size={32} />
          </Button>
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
              {Boolean(formData.address) && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span className="truncate font-medium">{String(formData.address)}</span>
                </div>
              )}
            </div>

            {/* Chọn Danh mục */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">{LABELS.RESTAURANT.MODAL.CATEGORY_LABEL}</label>
              <select
                value={formData.categoryId || ''}
                onChange={e => handleFieldChange('categoryId', e.target.value)}
                className="form-input py-4 px-6 rounded-2xl text-sm font-semibold"
              >
                <option value="">{LABELS.RESTAURANT.MODAL.CATEGORY_PLACEHOLDER}</option>
                {categoryOptions}
              </select>
            </div>

            <Input 
              label={LABELS.FORM.FOOD_NAME} 
              value={formData.name} 
              onChange={e => handleFieldChange('name', e.target.value)} 
              className="md:col-span-2" 
            />
             <Input 
              label={LABELS.FORM.PRICE} 
              type="number" 
              value={formData.price} 
              onChange={e => handleFieldChange('price', e.target.value)} 
            />
            <Input 
              label={LABELS.FORM.TAGS} 
              value={formData.tags} 
              onChange={e => handleFieldChange('tags', e.target.value)} 
            />
            <Input 
              label={LABELS.FORM.CALORIES} 
              type="number" 
              value={formData.calories || ''} 
              onChange={e => handleFieldChange('calories', e.target.value)} 
            />
            <Input 
              label={LABELS.FORM.CARBS} 
              type="number" 
              value={formData.carbs || ''} 
              onChange={e => handleFieldChange('carbs', e.target.value)} 
            />
            <Input 
              label={LABELS.FORM.PROTEIN} 
              type="number" 
              value={formData.protein || ''} 
              onChange={e => handleFieldChange('protein', e.target.value)} 
            />
            <Input 
              label={LABELS.FORM.FAT} 
              type="number" 
              value={formData.fat || ''} 
              onChange={e => handleFieldChange('fat', e.target.value)} 
            />
            <div className="md:col-span-2 space-y-2">
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">
                {LABELS.UPLOADER.FOOD_IMAGE}
              </label>
              <ImageUploader
                currentUrl={formData.image}
                onUploaded={(url) => handleFieldChange('image', url)}
                uploadType="food"
                aspectRatio="food"
                allowManualUrl
                placeholderUrl={LABELS.FORM.IMAGE_URL}
              />
            </div>
            <Input 
              label={LABELS.FORM.DESCRIPTION} 
              isTextArea 
              value={formData.description} 
              onChange={e => handleFieldChange('description', e.target.value)} 
              className="md:col-span-2" 
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
