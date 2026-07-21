/**
 * Mục đích: Component hiển thị chi tiết một thẻ bài viết Khuyến mãi từ đối tác nhà hàng.
 * File liên quan: OffersSection.tsx, useOffers.ts
 * Design Pattern: Presentation Component (Stateless/Dumb Component)
 */
'use client';

import React from 'react';
import { Store, Trash2, Percent, Calendar, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { User, UserRole } from '@/types/user';
import { OfferData } from '@/hooks/useOffers';
import { useRouter } from 'next/navigation';
import { toast } from '@/store/useToastStore';

interface PromotionCardProps {
  offer: OfferData;
  user: Partial<User> | null;
  onDelete: (id: number) => void;
}

export const PromotionCard = ({ offer, user, onDelete }: PromotionCardProps) => {
  const router = useRouter();

  const getPromoBadgeColor = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'bg-rose-500 text-white';
      case 'COMBO': return 'bg-amber-500 text-white';
      case 'GIFT': return 'bg-emerald-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPromoLabel = (type: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER') => {
    return LABELS.OFFERS.PROMO_TYPES[type] || LABELS.OFFERS.PROMO_TYPES.OTHER;
  };

  const handleViewStore = () => {
    if (offer.restaurantId) {
      router.push(`/restaurant/${offer.restaurantId}`);
    } else {
      toast.info(LABELS.OFFERS.CONTACT_TOAST(offer.restaurantName));
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || (user?.role === UserRole.RESTAURANT && offer.restaurantId === user?.id);

  return (
    <article className="card-premium overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 h-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl">
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800/80 overflow-hidden shrink-0 flex items-center justify-center p-4">
        <SafeImage
          src={offer.image}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
        />
        
        {/* Promo Badge */}
        <span className={`absolute top-4 left-4 text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-md ${getPromoBadgeColor(offer.promoType)}`}>
          {getPromoLabel(offer.promoType)}
        </span>

        {/* Delete button (Trash2) */}
        {canDelete && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(offer.id);
            }}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-500 hover:text-white dark:bg-slate-950/90 text-rose-500 rounded-xl transition-all shadow-md backdrop-blur-sm border border-rose-500/10 cursor-pointer"
            title={LABELS.OFFERS.DELETE_BTN}
            aria-label={LABELS.OFFERS.DELETE_BTN}
            variant="none"
            size="none"
          >
            <Trash2 size={16} />
          </Button>
        )}

        {/* Discount Value tag */}
        <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm text-primary text-xs font-black px-3 py-1.5 rounded-xl border border-primary/20 shadow-md flex items-center gap-1">
          <Percent size={14} />
          {offer.discountValue}
        </div>
      </div>

      {/* Content body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
            <Store size={14} className="text-primary" />
            <span className="truncate">{offer.restaurantName}</span>
          </div>
          
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {offer.title}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
            {offer.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-900 text-xs font-bold text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400" />
            <span>{LABELS.OFFERS.VALID_UNTIL(offer.validUntil)}</span>
          </div>
          
          <Button 
            onClick={handleViewStore}
            className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 font-bold"
            variant="none"
            size="none"
          >
            {LABELS.OFFERS.VIEW_STORE}
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </article>
  );
};
