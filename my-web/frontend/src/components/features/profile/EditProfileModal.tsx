// Mục đích file này để làm gì: Component Modal để người dùng chỉnh sửa thông tin cá nhân.
// Các file khác hay file này có ý nghĩa như nào: Hiển thị popup chứa các form nhập liệu: tên, số điện thoại, avatar, cover, tiểu sử, địa chỉ, công việc.
// Các chức năng đặc biệt: Tích hợp dánh sách Tỉnh/Thành phố và Quận/Huyện động từ LOCATION_DATA.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: EditProfileModal component.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { LOCATION_DATA, DEFAULT_CITY } from '@/constants/location.constant';
import { ProfileEditState } from '@/hooks/useProfileData';
import { UserRole } from '@/types/user';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData: ProfileEditState;
  setEditData: (data: ProfileEditState) => void;
  loading: boolean;
  onSave: () => void;
  role?: string;
}

import { ConfirmModal } from '@/components/base/ConfirmModal';

export const EditProfileModal = ({
  isOpen,
  onClose,
  editData,
  setEditData,
  loading,
  onSave,
  role
}: EditProfileModalProps) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

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
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="modal-card relative z-10 max-w-2xl w-full !p-0 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{LABELS.SETTINGS.PROFILE.EDIT_MODAL.TITLE}</h3>
          <Button 
            onClick={onClose} 
            aria-label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.CLOSE_SETTINGS}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            variant="none"
            size="none"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.NAME} 
              value={editData.name || ''} 
              onChange={e => setEditData({...editData, name: e.target.value})} 
            />
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.PHONE} 
              value={editData.phone || ''} 
              onChange={e => setEditData({...editData, phone: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.AVATAR} 
              value={editData.avatar || ''} 
              onChange={e => setEditData({...editData, avatar: e.target.value})} 
            />
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.COVER} 
              value={editData.coverImage || ''} 
              onChange={e => setEditData({...editData, coverImage: e.target.value})} 
            />
          </div>

          {role === UserRole.RESTAURANT && (
            <div className="ai-box p-4 rounded-card space-y-3 border">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {LABELS.SETTINGS.PROFILE.EDIT_MODAL.MERCHANT_SYNC}
              </h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer text-small font-semibold text-gray-700 dark:text-slate-300 hover:text-primary transition-colors">
                  <Input
                    type="checkbox"
                    checked={editData.syncWithRestaurantLogo || false}
                    onChange={(e) => setEditData({ ...editData, syncWithRestaurantLogo: (e.target as HTMLInputElement).checked })}
                    variant="none"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{LABELS.SETTINGS.PROFILE.EDIT_MODAL.SYNC_AVATAR}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-small font-semibold text-gray-700 dark:text-slate-300 hover:text-primary transition-colors">
                  <Input
                    type="checkbox"
                    checked={editData.syncWithRestaurantCover || false}
                    onChange={(e) => setEditData({ ...editData, syncWithRestaurantCover: (e.target as HTMLInputElement).checked })}
                    variant="none"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{LABELS.SETTINGS.PROFILE.EDIT_MODAL.SYNC_COVER}</span>
                </label>
              </div>
            </div>
          )}

          <Input 
            label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.BIO} 
            isTextArea 
            value={editData.bio || ''} 
            onChange={e => setEditData({...editData, bio: e.target.value})} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tỉnh / Thành phố */}
            <div>
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">
                {LABELS.SETTINGS.PROFILE.EDIT_MODAL.CITY}
              </label>
              <select
                value={editData.city || DEFAULT_CITY}
                onChange={(e) => {
                  setEditData({
                    ...editData,
                    city: e.target.value,
                    district: ''
                  });
                }}
                className="form-input py-4 px-6 text-sm font-semibold mt-2"
              >
                {LOCATION_DATA.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quận / Huyện */}
            <div>
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">
                {LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT}
              </label>
              <select
                value={editData.district || ''}
                onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                className="form-input py-4 px-6 text-sm font-semibold mt-2"
              >
                <option value="" disabled hidden>
                  {LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT_PLACEHOLDER}
                </option>
                {LOCATION_DATA.find((c) => c.value === (editData.city || DEFAULT_CITY))
                  ?.districts.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Địa chỉ chi tiết */}
            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.STREET} 
              placeholder={LABELS.SETTINGS.PROFILE.EDIT_MODAL.STREET_PLACEHOLDER} 
              value={editData.street || ''} 
              onChange={e => setEditData({...editData, street: e.target.value})} 
              className="md:col-span-2"
            />

            <Input 
              label={LABELS.SETTINGS.PROFILE.EDIT_MODAL.WORK} 
              placeholder={LABELS.FORM.PLACEHOLDERS.WORK} 
              value={editData.workAt || ''} 
              onChange={e => setEditData({...editData, workAt: e.target.value})} 
              className="md:col-span-2"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            {LABELS.COMMON.CANCEL}
          </Button>
          <Button variant="primary" fullWidth loading={loading} onClick={() => setShowConfirm(true)}>
            <Save size={18} className="mr-2" /> {LABELS.COMMON.SAVE}
          </Button>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.SETTINGS.PROFILE_CONFIRM_TITLE}
        message={LABELS.SETTINGS.PROFILE_CONFIRM_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="warning"
        onConfirm={() => {
          setShowConfirm(false);
          onSave();
        }}
        onCancel={() => {
          setShowConfirm(false);
        }}
      />
    </div>
  );
};
