// Mục đích file này để làm gì: Component Tab hiển thị chi tiết thông tin liên hệ và giới thiệu của nhà hàng.
// Các file khác hay file này có ý nghĩa như nào: Nằm trong phần Tabs của trang public profile nhà hàng, giúp người dùng tra cứu nhanh giờ mở cửa, số điện thoại, email, bản đồ và tiểu sử.
// Các chức năng đặc biệt: Hiển thị an toàn khi thiếu dữ liệu (fallback tự động qua LABELS), tách layout linh hoạt giữa thông tin chính và tiểu sử.
// Các biến, hàm đặc biệt trong file: Nhận prop restaurantData chứa thông tin profile để render các block chi tiết (thời gian, sđt, email, link map).
'use client';

import React from 'react';
import { 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  MapPin 
} from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface RestaurantInfoTabProps {
  restaurantData: {
    mapUrl?: string;
    profile?: {
      openingHours?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      bio?: string | null;
    } | null;
    [key: string]: unknown;
  };
}

export const RestaurantInfoTab = ({ restaurantData }: RestaurantInfoTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="card-container lg:col-span-2 p-6 md:p-8 flex flex-col gap-6">
        <h3 className="text-h3 font-black text-gray-900 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.DETAIL_INFO}</h3>
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-body font-extrabold text-gray-900 mb-1">{LABELS.RESTAURANT.OPERATING_HOURS_LABEL}</h4>
            <p className="text-small text-gray-500 font-medium">
              {restaurantData.profile?.openingHours || LABELS.RESTAURANT.PUBLIC_PROFILE.NO_HOURS}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <h4 className="text-body font-extrabold text-gray-900 mb-1">{LABELS.RESTAURANT.CONTACT_PHONE}</h4>
            <p className="text-small text-gray-500 font-medium">
              {restaurantData.profile?.contactPhone || LABELS.RESTAURANT.PUBLIC_PROFILE.NO_PHONE}
            </p>
          </div>
        </div>

        {restaurantData.profile?.contactEmail && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h4 className="text-body font-extrabold text-gray-900 mb-1">{LABELS.RESTAURANT.PUBLIC_PROFILE.CONTACT_EMAIL}</h4>
              <p className="text-small text-gray-500 font-medium">
                {restaurantData.profile.contactEmail}
              </p>
            </div>
          </div>
        )}

        {restaurantData.mapUrl && (
          <div className="mt-4 border-t border-gray-100 dark:border-slate-800 pt-6">
            <h4 className="text-body font-extrabold text-gray-900 mb-3 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.MAP_TITLE}</span>
            </h4>
            <a 
              href={restaurantData.mapUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-small font-bold text-primary hover:underline flex items-center gap-1.5"
            >
              <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.MAP_OPEN}</span>
              <MapPin size={14} />
            </a>
          </div>
        )}
      </div>

      {/* Quick Bio Info */}
      <div className="card-container p-6 md:p-8 flex flex-col gap-4">
        <h3 className="text-h3 font-black text-gray-900 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.BIO_TITLE}</h3>
        <p className="text-small text-gray-500 leading-relaxed font-medium">
          {restaurantData.profile?.bio || LABELS.RESTAURANT.PUBLIC_PROFILE.BIO_EMPTY}
        </p>
      </div>
    </div>
  );
};
