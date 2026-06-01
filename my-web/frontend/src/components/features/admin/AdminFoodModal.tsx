/**
 * Mục đích file này để làm gì: Modal dành cho Admin để chỉnh sửa thông tin nhanh của một món ăn trên hệ thống.
 * Các file khác hay file này có ý nghĩa như nào: Được nhúng vào trang quản trị (Admin Panel), nhận dữ liệu từ bảng danh sách món ăn.
 * Các chức năng đặc biệt: Nhận dữ liệu `editFormData` từ component cha và cập nhật liên tục khi gõ.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

export interface AdminFoodFormData {
  name: string;
  price: string | number;
  tags: string;
  image: string;
  description: string;
}

interface AdminFoodModalProps {
  editingFood: { id: number; [key: string]: unknown } | null;
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
  if (!editingFood) return null;

  return (
    <div className="modal-backdrop">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-card"
      >
        <h3 className="text-h2 mb-6 flex items-center gap-2">
          <Settings className="text-blue-500" /> {LABELS.ADMIN.MODAL.EDIT_TITLE}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label={LABELS.ADMIN.MODAL.FOOD_NAME} 
            value={editFormData.name} 
            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
            className="md:col-span-2" 
          />
          <Input 
            label={LABELS.ADMIN.MODAL.PRICE} 
            type="number" 
            value={editFormData.price} 
            onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} 
          />
          <Input 
            label={LABELS.ADMIN.MODAL.TAGS} 
            value={editFormData.tags} 
            onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })} 
          />
          <Input 
            label={LABELS.ADMIN.MODAL.IMAGE_URL} 
            value={editFormData.image} 
            onChange={e => setEditFormData({ ...editFormData, image: e.target.value })} 
            className="md:col-span-2" 
          />
          <Input 
            label={LABELS.ADMIN.MODAL.DESCRIPTION} 
            isTextArea 
            value={editFormData.description} 
            onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} 
            className="md:col-span-2" 
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            {LABELS.COMMON.CANCEL}
          </Button>
          <Button fullWidth onClick={onSave}>
            {LABELS.COMMON.SAVE}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
