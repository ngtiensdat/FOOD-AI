/**
 * Mục đích file này để làm gì: Modal dành cho Admin để chỉnh sửa thông tin nhanh của một món ăn trên hệ thống.
 * Các file khác hay file này có ý nghĩa như nào: Được nhúng vào trang quản trị (Admin Panel), nhận dữ liệu từ bảng danh sách món ăn.
 * Các chức năng đặc biệt: Nhận dữ liệu `editFormData` từ component cha và cập nhật liên tục khi gõ.
 */
'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { ImageUploader } from '@/components/base/ImageUploader';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { AdminFoodItem } from '@/types/food';

export interface AdminFoodFormData {
  name: string;
  price: string | number;
  tags: string;
  image: string;
  description: string;
}

interface AdminFoodModalProps {
  editingFood: AdminFoodItem | null;
  editFormData: AdminFoodFormData;
  setEditFormData: (data: AdminFoodFormData) => void;
  onClose: () => void;
  onSave: () => void;
}

export const AdminFoodModal = ({
  editingFood,
  editFormData,
  setEditFormData,
  onClose,
  onSave
}: AdminFoodModalProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingUploadPromiseRef = useRef<Promise<string> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    try {
      if (pendingUploadPromiseRef.current) {
        toast.info(LABELS.UPLOADER.UPLOADING_WAIT);
        try {
          const uploadedUrl = await pendingUploadPromiseRef.current;
          if (uploadedUrl) {
            editFormData.image = uploadedUrl;
            setEditFormData({ ...editFormData, image: uploadedUrl });
          }
        } catch {
          setIsSaving(false);
          return;
        }
      }
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  if (!editingFood) return null;

  return (
    <>
      <div className="modal-wrapper">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-overlay" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="modal-card max-w-xl w-[94%] max-h-[90vh] flex flex-col p-6 rounded-3xl relative z-10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <Settings className="text-primary" size={20} />
              <span>{LABELS.ADMIN.MODAL.EDIT_TITLE}</span>
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

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Tên món */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.ADMIN.MODAL.FOOD_NAME} <span className="text-rose-500">*</span>
              </label>
              <Input 
                variant="none"
                required
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                value={editFormData.name} 
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
              />
            </div>

            {/* Giá & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                  {LABELS.ADMIN.MODAL.PRICE} (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <Input 
                  variant="none"
                  type="number" 
                  required
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  value={editFormData.price} 
                  onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                  {LABELS.ADMIN.MODAL.TAGS}
                </label>
                <Input 
                  variant="none"
                  placeholder="VD: Cay, Món chay, Bán chạy..."
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  value={editFormData.tags} 
                  onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })} 
                />
              </div>
            </div>

            {/* Ảnh món ăn */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.UPLOADER.FOOD_IMAGE}
              </label>
              <ImageUploader
                currentUrl={editFormData.image}
                onUploaded={(url) => setEditFormData({ ...editFormData, image: url })}
                onUploadingChange={setIsUploadingImage}
                onUploadPromise={(promise) => {
                  pendingUploadPromiseRef.current = promise;
                }}
                uploadType="food"
                aspectRatio="food"
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
                {LABELS.ADMIN.MODAL.DESCRIPTION}
              </label>
              <Input 
                isTextArea 
                variant="none"
                rows={3}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                value={editFormData.description} 
                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-2">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 rounded-xl text-xs font-bold"
            >
              {LABELS.COMMON.CANCEL}
            </Button>
            <Button 
              fullWidth 
              onClick={() => setShowConfirm(true)}
              disabled={isSaving}
              className="py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUploadingImage ? 'Đang tải ảnh và lưu...' : LABELS.COMMON.PROCESSING}
                </>
              ) : (
                LABELS.COMMON.SAVE
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.ADMIN.CONFIRM.SAVE_FOOD}
        message={LABELS.ADMIN.CONFIRM.SAVE_FOOD_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />
    </>
  );
};
