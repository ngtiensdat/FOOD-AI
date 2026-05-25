'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, XCircle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFood: any;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FoodFormModal = ({
  isOpen,
  onClose,
  editingFood,
  formData,
  setFormData,
  onSubmit
}: FoodFormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="modal-card"
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
              label={LABELS.FORM.ADDRESS} 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              className="md:col-span-2" 
            />
            <Input 
              label={LABELS.FORM.MAP_URL} 
              value={formData.mapUrl} 
              onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} 
              className="md:col-span-2" 
            />
            <Input 
              label={LABELS.FORM.LAT} 
              type="number"
              step="any"
              value={formData.lat} 
              onChange={e => setFormData({ ...formData, lat: e.target.value })} 
            />
            <Input 
              label={LABELS.FORM.LNG} 
              type="number"
              step="any"
              value={formData.lng} 
              onChange={e => setFormData({ ...formData, lng: e.target.value })} 
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
