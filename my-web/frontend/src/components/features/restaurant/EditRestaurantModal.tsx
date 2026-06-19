// Mục đích file này để làm gì: Modal chỉnh sửa thông tin nhà hàng toàn diện cho Merchant.
// Các file khác hay file này có ý nghĩa như nào: Được hiển thị từ Quản trị viên của Nhà hàng (Restaurant Admin) khi bấm nút chỉnh sửa thông tin nhà hàng.
// Các chức năng đặc biệt: Tích hợp bộ chọn địa điểm động, cờ đồng bộ ảnh cá nhân, tab thông tin cơ bản, hình ảnh thương hiệu, giờ mở cửa và live preview trực quan.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, Tabbed Interface, Live Preview Sync.
// Các biến, hàm đặc biệt trong file: EditRestaurantModal component, updateRestaurantProfile.

import React, { useState } from 'react';
import { X, Store } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Alert } from '@/components/base/Alert';
import { Restaurant, UpdateRestaurantInput } from '@/types/restaurant';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { LABELS } from '@/constants/labels';
import { useEditRestaurant } from '@/hooks/useEditRestaurant';
import { RestaurantLivePreview } from './RestaurantLivePreview';
import { RestaurantBasicInfoTab } from './RestaurantBasicInfoTab';
import { RestaurantBrandImagesTab } from './RestaurantBrandImagesTab';
import { RestaurantOperatingTab } from './RestaurantOperatingTab';

interface EditRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null | undefined;
  onSave: (data: UpdateRestaurantInput) => Promise<boolean>;
}

export const EditRestaurantModal: React.FC<EditRestaurantModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSave,
}) => {
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    name,
    setName,
    description,
    setDescription,
    address,
    setAddress,
    city,
    setCity,
    district,
    setDistrict,
    mapUrl,
    setMapUrl,
    logo,
    setLogo,
    coverImage,
    setCoverImage,
    bio,
    setBio,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    openingHours,
    setOpeningHours,
    syncWithPersonalAvatar,
    setSyncWithPersonalAvatar,
    syncWithPersonalCover,
    setSyncWithPersonalCover,
    handleSubmit,
  } = useEditRestaurant({ restaurant, isOpen, onSave, onClose });

  const [showConfirm, setShowConfirm] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-wrapper">
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal-card max-w-4xl w-full !p-0 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] max-h-[750px] relative z-10">
        
        {/* Left Column: Real-time Live Preview Panel */}
        <RestaurantLivePreview
          name={name}
          bio={bio}
          coverImage={coverImage}
          logo={logo}
          district={district}
          city={city}
          openingHours={openingHours}
        />

        {/* Right Column: Settings Tabs and Form */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="text-h3 font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Store className="text-primary" /> {LABELS.RESTAURANT.SETTINGS_TITLE}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{LABELS.RESTAURANT.EDIT_MODAL.SUBTITLE}</p>
            </div>
            <Button
              onClick={onClose}
              aria-label={LABELS.RESTAURANT.EDIT_MODAL.CLOSE_SETTINGS}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              variant="none"
              size="none"
            >
              <X size={20} className="text-gray-500" />
            </Button>
          </div>

          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col justify-between">
            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-50 dark:border-slate-800 pb-3">
              {(['info', 'images', 'contact'] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  variant="none"
                  size="none"
                >
                  {tab === 'info' && LABELS.RESTAURANT.EDIT_MODAL.TAB_INFO}
                  {tab === 'images' && LABELS.RESTAURANT.EDIT_MODAL.TAB_IMAGES}
                  {tab === 'contact' && LABELS.RESTAURANT.EDIT_MODAL.TAB_CONTACT}
                </Button>
              ))}
            </div>

            {/* Form Fields by Tab */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === 'info' && (
                <RestaurantBasicInfoTab
                  name={name}
                  setName={setName}
                  bio={bio}
                  setBio={setBio}
                  description={description}
                  setDescription={setDescription}
                />
              )}

              {activeTab === 'images' && (
                <RestaurantBrandImagesTab
                  logo={logo}
                  setLogo={setLogo}
                  coverImage={coverImage}
                  setCoverImage={setCoverImage}
                  syncWithPersonalAvatar={syncWithPersonalAvatar}
                  setSyncWithPersonalAvatar={setSyncWithPersonalAvatar}
                  syncWithPersonalCover={syncWithPersonalCover}
                  setSyncWithPersonalCover={setSyncWithPersonalCover}
                />
              )}

              {activeTab === 'contact' && (
                <RestaurantOperatingTab
                  city={city}
                  setCity={setCity}
                  district={district}
                  setDistrict={setDistrict}
                  address={address}
                  setAddress={setAddress}
                  openingHours={openingHours}
                  setOpeningHours={setOpeningHours}
                  contactPhone={contactPhone}
                  setContactPhone={setContactPhone}
                  contactEmail={contactEmail}
                  setContactEmail={setContactEmail}
                  mapUrl={mapUrl}
                  setMapUrl={setMapUrl}
                />
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-50 dark:border-slate-800 pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-card"
              >
                {LABELS.RESTAURANT.EDIT_MODAL.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-card px-6"
              >
                {loading ? LABELS.RESTAURANT.EDIT_MODAL.SAVING : LABELS.RESTAURANT.EDIT_MODAL.SUBMIT}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.RESTAURANT.EDIT_MODAL.CONFIRM_TITLE}
        message={LABELS.RESTAURANT.EDIT_MODAL.CONFIRM_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        onConfirm={() => {
          setShowConfirm(false);
          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />
    </>
  );
};
