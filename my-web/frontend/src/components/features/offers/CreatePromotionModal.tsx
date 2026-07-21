/**
 * Mục đích: Component Modal tạo chương trình khuyến mãi mới của nhà hàng đối tác.
 * File liên quan: OffersSection.tsx, useOffers.ts
 * Design Pattern: Smart Form Component / Modal
 */
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/base/Button';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: {
    title: string;
    description: string;
    promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
    discountValue: string;
    image: string;
    validUntil: string;
    status?: string;
  }) => Promise<boolean>;
  user: Partial<User> | null;
}

export const CreatePromotionModal = ({ isOpen, onClose, onSubmit, user }: CreatePromotionModalProps) => {
  const [promoType, setPromoType] = useState<'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER'>('DISCOUNT');
  const [promoValue, setPromoValue] = useState('');
  const [promoExpiry, setPromoExpiry] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [isCustomValue, setIsCustomValue] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Tự động chọn mốc khuyến mãi đầu tiên của loại tương ứng khi loại thay đổi
  useEffect(() => {
    const presets = LABELS.VOUCHER_MANAGER.FORM_OPTIONS.DISCOUNT_VALUES[promoType];
    if (presets && presets.length > 0) {
      setPromoValue(presets[0]);
      setIsCustomValue(false);
      setCustomValue('');
    }
  }, [promoType]);

  if (!isOpen) return null;

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalValue = isCustomValue ? customValue.trim() : promoValue.trim();

    if (!finalValue) {
      toast.error(LABELS.OFFERS.TOAST.VALUE_REQUIRED);
      return;
    }
    if (!promoExpiry) {
      toast.error(LABELS.OFFERS.TOAST.EXPIRY_REQUIRED);
      return;
    }
    if (!promoDesc.trim()) {
      toast.error(LABELS.OFFERS.TOAST.DESC_REQUIRED);
      return;
    }

    // Tự động sinh tiêu đề: [Tên Nhà Hàng] - [Loại] [Mốc ưu đãi]
    const typePrefix = promoType === 'DISCOUNT' ? LABELS.OFFERS.FORM.PREFIX_DISCOUNT : promoType === 'GIFT' ? LABELS.OFFERS.FORM.PREFIX_GIFT : '';
    const autoTitle = `${user?.name || LABELS.OFFERS.FORM.AUTO_TITLE_RESTAURANT} - ${typePrefix}${finalValue}`;
    // Tự động gán ảnh 3D mặc định theo loại
    const autoImage = LABELS.OFFERS.TYPE_IMAGES[promoType];

    const success = await onSubmit({
      title: autoTitle,
      description: promoDesc.trim(),
      promoType,
      discountValue: finalValue,
      image: autoImage,
      validUntil: promoExpiry,
      status: isCustomValue ? 'PENDING' : 'APPROVED',
    });

    if (success) {
      onClose();
      // Reset form
      setPromoType('DISCOUNT');
      setPromoExpiry('');
      setPromoDesc('');
      setIsCustomValue(false);
      setCustomValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">
            {LABELS.OFFERS.CREATE_MODAL_TITLE}
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold">
            {LABELS.OFFERS.FORM.MODAL_SUBTITLE(user?.name)}
          </p>
        </div>

        <form onSubmit={handleSubmitOffer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {LABELS.OFFERS.FORM.TYPE_LABEL}
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                value={promoType}
                onChange={(e) => setPromoType(e.target.value as any)}
              >
                <option value="DISCOUNT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.DISCOUNT}</option>
                <option value="COMBO">{LABELS.OFFERS.FORM.TYPE_OPTIONS.COMBO}</option>
                <option value="GIFT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.GIFT}</option>
                <option value="OTHER">{LABELS.OFFERS.FORM.TYPE_OPTIONS.OTHER}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {LABELS.OFFERS.FORM.VALUE_LABEL}
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                value={isCustomValue ? 'CUSTOM' : promoValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CUSTOM') {
                    setIsCustomValue(true);
                  } else {
                    setIsCustomValue(false);
                    setPromoValue(val);
                  }
                }}
              >
                {LABELS.VOUCHER_MANAGER.FORM_OPTIONS.DISCOUNT_VALUES[promoType].map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
                <option value="CUSTOM">{LABELS.OFFERS.FORM.CUSTOM_OPTION}</option>
              </select>
            </div>
          </div>

          {isCustomValue && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {LABELS.OFFERS.FORM.CUSTOM_LABEL}
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all"
                placeholder={LABELS.OFFERS.FORM.CUSTOM_PLACEHOLDER}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                required
              />
              <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                {LABELS.OFFERS.FORM.CUSTOM_PENDING_WARN}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {LABELS.OFFERS.FORM.EXPIRY_LABEL}
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
              value={promoExpiry}
              onChange={(e) => setPromoExpiry(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {LABELS.OFFERS.FORM.DESC_LABEL}
            </label>
            <textarea
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all resize-none"
              placeholder={LABELS.OFFERS.FORM.DESC_PLACEHOLDER}
              value={promoDesc}
              onChange={(e) => setPromoDesc(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-bold border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer"
            >
              {LABELS.OFFERS.FORM.CANCEL}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="font-bold rounded-2xl cursor-pointer"
            >
              {LABELS.OFFERS.FORM.SUBMIT}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
