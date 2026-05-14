'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface AdminFoodModalProps {
  editingFood: any;
  editFormData: any;
  setEditFormData: (data: any) => void;
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
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card">
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
