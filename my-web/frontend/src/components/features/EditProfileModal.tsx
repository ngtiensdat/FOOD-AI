'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData: any;
  setEditData: (data: any) => void;
  loading: boolean;
  onSave: () => void;
}

export const EditProfileModal = ({
  isOpen,
  onClose,
  editData,
  setEditData,
  loading,
  onSave
}: EditProfileModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="modal-card"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">{LABELS.SETTINGS.PROFILE.EDIT_MODAL.TITLE}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.NAME} 
              value={editData.name} 
              onChange={e => setEditData({...editData, name: e.target.value})} 
            />
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.PHONE} 
              value={editData.phone} 
              onChange={e => setEditData({...editData, phone: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.AVATAR} 
              value={editData.avatar} 
              onChange={e => setEditData({...editData, avatar: e.target.value})} 
            />
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.COVER} 
              value={editData.coverImage} 
              onChange={e => setEditData({...editData, coverImage: e.target.value})} 
            />
          </div>

          <Input 
            label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.BIO} 
            isTextArea 
            value={editData.bio} 
            onChange={e => setEditData({...editData, bio: e.target.value})} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.ADDRESS} 
              placeholder={LABELS.FORM.PLACEHOLDERS.ADDRESS} 
              value={editData.address} 
              onChange={e => setEditData({...editData, address: e.target.value})} 
            />
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.WORK} 
              placeholder={LABELS.FORM.PLACEHOLDERS.WORK} 
              value={editData.workAt} 
              onChange={e => setEditData({...editData, workAt: e.target.value})} 
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            {LABELS.COMMON.CANCEL}
          </Button>
          <Button variant="primary" fullWidth loading={loading} onClick={onSave}>
            <Save size={18} className="mr-2" /> {LABELS.COMMON.SAVE}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
