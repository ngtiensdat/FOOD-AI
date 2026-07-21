/**
 * Mục đích: Component hiển thị chi tiết một thẻ Voucher quy đổi điểm tích lũy.
 * File liên quan: OffersSection.tsx, useOffers.ts
 * Design Pattern: Presentation Component (Stateless/Dumb Component)
 */
'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';
import { VoucherData } from '@/hooks/useOffers';

interface VoucherCardProps {
  voucher: VoucherData;
  user: Partial<User> | null;
  onRedeem: (voucher: VoucherData) => void;
}

export const VoucherCard = ({ voucher, user, onRedeem }: VoucherCardProps) => {
  const userPoints = user?.points || 0;
  const canAfford = userPoints >= voucher.pointsCost;

  return (
    <div
      className={`card-premium p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 h-full ${
        canAfford
          ? 'hover:border-primary/40 hover:-translate-y-1'
          : 'opacity-75'
      } bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl`}
    >
      {/* Voucher Left Design Cutout */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full border-y border-r border-gray-200 dark:border-slate-800" />
      {/* Voucher Right Design Cutout */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full border-y border-l border-gray-200 dark:border-slate-800" />

      <div className="pl-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-h2 !text-2xl text-primary font-black">{voucher.discountValue}</span>
          <span className="text-mini font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md">
            {LABELS.LOYALTY.REQUIRED_POINTS(voucher.pointsCost)}
          </span>
        </div>

        <h4 className="text-body font-bold text-gray-800 dark:text-white mt-3">{voucher.title}</h4>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{voucher.description}</p>

        <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-800 text-mini text-gray-400 font-bold">
          <span>{LABELS.LOYALTY.VOUCHER_MIN_SPEND_PREFIX}{voucher.minSpend}</span>
          <span>{LABELS.LOYALTY.VOUCHER_EXPIRY_PREFIX}{voucher.expiryDays}{LABELS.LOYALTY.VOUCHER_EXPIRY_SUFFIX}</span>
        </div>
      </div>

      <div className="mt-6 pl-2">
        <Button
          variant={canAfford ? 'primary' : 'secondary'}
          disabled={!canAfford || !user}
          onClick={() => onRedeem(voucher)}
          className="w-full text-xs font-bold"
        >
          {!user ? (
            LABELS.AUTH.LOGIN_REQUIRED
          ) : canAfford ? (
            <span className="flex items-center justify-center gap-1.5">
              <Sparkles size={14} /> {LABELS.LOYALTY.REDEEM}
            </span>
          ) : (
            LABELS.LOYALTY.REDEEM_ERROR.split('.')[0]
          )}
        </Button>
      </div>
    </div>
  );
};
