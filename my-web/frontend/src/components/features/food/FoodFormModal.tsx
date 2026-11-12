/**
 * Mục đích file này để làm gì: Component Modal để Thêm mới hoặc Chỉnh sửa món ăn.
 * Các file khác hay file này có ý nghĩa như nào: Dùng trong trang quản trị của nhà hàng hoặc admin, hiển thị form nhập liệu.
 * Các chức năng đặc biệt: Tích hợp chọn danh mục, tự động điền địa chỉ/vị trí theo cơ sở kinh doanh, tái sử dụng cho cả Thêm và Sửa.
 */
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, X, MapPin, Sparkles, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { ImageUploader } from '@/components/base/ImageUploader';
import { LABELS } from '@/constants/labels';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { toast } from '@/store/useToastStore';
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
  onSubmit: (e: React.FormEvent, overrides?: Partial<FoodFormData>) => Promise<void> | void;
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
  const pendingUploadPromiseRef = useRef<Promise<string> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (key: keyof FoodFormData, value: unknown) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.image;

      // Xử lý bất đồng bộ: Nếu ảnh đang được tải lên Cloud mà người dùng đã ấn Lưu
      if (pendingUploadPromiseRef.current) {
        toast.info(LABELS.UPLOADER.UPLOADING_WAIT);
        try {
          const uploadedUrl = await pendingUploadPromiseRef.current;
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
            handleFieldChange('image', uploadedUrl);
          }
        } catch {
          // Lỗi đã được toast trong ImageUploader
          setIsSubmitting(false);
          return;
        }
      }

      await onSubmit(e, { image: finalImageUrl });
    } catch (err) {
      console.error('Lỗi khi gửi form món ăn:', err);
    } finally {
      setIsSubmitting(false);
    }
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
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 10 }} 
        className="modal-card max-w-2xl w-[94%] max-h-[90vh] flex flex-col p-6 rounded-3xl relative z-10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            {editingFood ? <Edit className="text-blue-500" size={20} /> : <Plus className="text-primary" size={20} />} 
            <span>{editingFood ? LABELS.RESTAURANT.MODAL.EDIT_TITLE : LABELS.RESTAURANT.MODAL.ADD_TITLE}</span>
          </h3>
          <Button 
            onClick={onClose} 
            variant="none" 
            size="none" 
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Form Body with Smooth Scroll */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Row 1: Chi nhánh & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.RESTAURANT.MODAL.BRANCH_LABEL} <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.restaurantId || ''}
                onChange={e => onSelectBranch(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
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
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  <MapPin size={12} className="text-primary shrink-0" />
                  <span className="truncate">{String(formData.address)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.RESTAURANT.MODAL.CATEGORY_LABEL}
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={e => handleFieldChange('categoryId', e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="">{LABELS.RESTAURANT.MODAL.CATEGORY_PLACEHOLDER}</option>
                {categoryOptions}
              </select>
            </div>
          </div>

          {/* Row 2: Tên món ăn & Giá */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.FORM.FOOD_NAME} <span className="text-rose-500">*</span>
              </label>
              <Input 
                variant="none"
                required
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                value={formData.name} 
                onChange={e => handleFieldChange('name', e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.FORM.PRICE} (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <Input 
                variant="none"
                type="number" 
                required
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                value={formData.price} 
                onChange={e => handleFieldChange('price', e.target.value)} 
              />
            </div>
          </div>

          {/* Row 3: Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
              {LABELS.FORM.TAGS}
            </label>
            <Input 
              variant="none"
              placeholder="VD: Cay, Món chay, Bán chạy, Ăn vặt..."
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              value={formData.tags} 
              onChange={e => handleFieldChange('tags', e.target.value)} 
            />
          </div>

          {/* Row 4: Khối thông tin dinh dưỡng tinh gọn */}
          <div className="bg-gray-50/70 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity size={14} className="text-primary" />
                {LABELS.ANALYTICS.NUTRITION_GROUP}
              </span>
              <span className="text-[10px] text-gray-400">
                {LABELS.ANALYTICS.NUTRITION_SUBTITLE}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                  {LABELS.ANALYTICS.CALORIES_UNIT}
                </label>
                <Input 
                  variant="none"
                  type="number" 
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary"
                  value={formData.calories || ''} 
                  onChange={e => handleFieldChange('calories', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                  {LABELS.ANALYTICS.CARBS_UNIT}
                </label>
                <Input 
                  variant="none"
                  type="number" 
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary"
                  value={formData.carbs || ''} 
                  onChange={e => handleFieldChange('carbs', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                  {LABELS.ANALYTICS.PROTEIN_UNIT}
                </label>
                <Input 
                  variant="none"
                  type="number" 
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary"
                  value={formData.protein || ''} 
                  onChange={e => handleFieldChange('protein', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                  {LABELS.ANALYTICS.FAT_UNIT}
                </label>
                <Input 
                  variant="none"
                  type="number" 
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary"
                  value={formData.fat || ''} 
                  onChange={e => handleFieldChange('fat', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Row 5: Ảnh món ăn */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
              {LABELS.UPLOADER.FOOD_IMAGE}
            </label>
            <ImageUploader
              currentUrl={formData.image}
              onUploaded={(url) => handleFieldChange('image', url)}
              onUploadingChange={setIsUploadingImage}
              onUploadPromise={(promise) => {
                pendingUploadPromiseRef.current = promise;
              }}
              uploadType="food"
              aspectRatio="food"
            />
          </div>

          {/* Row 6: Mô tả */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
              {LABELS.FORM.DESCRIPTION}
            </label>
            <Input 
              isTextArea 
              variant="none"
              rows={2}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              value={formData.description} 
              onChange={e => handleFieldChange('description', e.target.value)} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 rounded-xl text-xs font-bold"
            >
              {LABELS.COMMON.CANCEL}
            </Button>
            <Button 
              type="submit" 
              fullWidth
              disabled={isSubmitting}
              className="py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUploadingImage ? 'Đang tải ảnh và lưu...' : LABELS.COMMON.PROCESSING}
                </>
              ) : (
                editingFood ? LABELS.RESTAURANT.MODAL.SUBMIT_EDIT : LABELS.RESTAURANT.MODAL.SUBMIT_ADD
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
