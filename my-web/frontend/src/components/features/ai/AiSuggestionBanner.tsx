/**
 * Mục đích file này để làm gì: Component hiển thị banner "Gợi ý AI" nổi bật, dùng để thu hút người dùng.
 * Các file khác hay file này có ý nghĩa như nào: Dùng ở các trang Dashboard/Profile để mời gọi người dùng xem các đề xuất cá nhân hoá.
 * Các chức năng đặc biệt: Thiết kế Gradient, sử dụng chung hệ thống LABELS.
 */
'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

export const AiSuggestionBanner = () => {
  return (
    <section className="gradient-bg p-8 rounded-card text-white shadow-2xl shadow-orange-200 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-h2 !text-white mb-4">{LABELS.CUSTOMER.AI_SUGGESTION}</h3>
        <p className="text-body opacity-90 mb-8 max-w-md">
          {LABELS.CUSTOMER.AI_SUGGESTION_DESC(LABELS.CUSTOMER.PLACEHOLDER_FOOD)}
        </p>
        <Button variant="secondary" className="px-8 hover:scale-105">
          {LABELS.RESTAURANT.VIEW_INSIGHT}
        </Button>
      </div>
      <Sparkles className="absolute right-[-20px] bottom-[-20px] opacity-20" size={180} />
    </section>
  );
};
