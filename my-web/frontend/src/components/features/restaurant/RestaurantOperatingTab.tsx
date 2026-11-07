import React from 'react';
import { MapPin, Clock, Phone, Mail, Globe, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/base/Input';
import { LOCATION_DATA } from '@/constants/location.constant';
import { LABELS } from '@/constants/labels';

interface RestaurantOperatingTabProps {
  city: string;
  setCity: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  openingHours: string;
  setOpeningHours: (val: string) => void;
  contactPhone: string;
  setContactPhone: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  mapUrl: string;
  setMapUrl: (val: string) => void;
}

export const RestaurantOperatingTab: React.FC<RestaurantOperatingTabProps> = ({
  city,
  setCity,
  district,
  setDistrict,
  address,
  setAddress,
  openingHours,
  setOpeningHours,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  mapUrl,
  setMapUrl,
}) => {
  return (
    <div className="space-y-3.5">
      {/* City & District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.CITY_LABEL}
          </label>
          <div className="relative flex items-center">
            <MapPin size={16} className="absolute left-3.5 text-primary pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              {LOCATION_DATA.map((c) => (
                <option key={c.value} value={c.value} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.DISTRICT_LABEL}
          </label>
          <div className="relative flex items-center">
            <MapPin size={16} className="absolute left-3.5 text-primary pointer-events-none" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              {LOCATION_DATA.find((c) => c.value === city)?.districts.map((d) => (
                <option key={d.value} value={d.value} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
          {LABELS.RESTAURANT.EDIT_MODAL.ADDRESS_LABEL}
        </label>
        <div className="relative flex items-center">
          <MapPin size={16} className="absolute left-3.5 text-primary" />
          <Input
            variant="none"
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.ADDRESS_PLACEHOLDER}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-medium leading-relaxed bg-orange-50/50 dark:bg-orange-950/10 px-2.5 py-1.5 rounded-lg border border-orange-100/30 dark:border-orange-900/20 flex items-center gap-1.5">
          <AlertTriangle size={13} className="shrink-0" />
          <span>{LABELS.RESTAURANT.EDIT_MODAL.ADDRESS_TIP}</span>
        </p>
      </div>

      {/* Hours & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.HOURS_LABEL}
          </label>
          <div className="relative flex items-center">
            <Clock size={16} className="absolute left-3.5 text-primary" />
            <Input
              variant="none"
              placeholder={LABELS.RESTAURANT.HOURS_PLACEHOLDER}
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.PHONE_LABEL}
          </label>
          <div className="relative flex items-center">
            <Phone size={16} className="absolute left-3.5 text-primary" />
            <Input
              variant="none"
              placeholder={LABELS.RESTAURANT.EDIT_MODAL.PHONE_PLACEHOLDER}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Email & Map URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.EMAIL_LABEL}
          </label>
          <div className="relative flex items-center">
            <Mail size={16} className="absolute left-3.5 text-primary" />
            <Input
              variant="none"
              type="email"
              placeholder={LABELS.RESTAURANT.EDIT_MODAL.EMAIL_PLACEHOLDER}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
            {LABELS.RESTAURANT.EDIT_MODAL.MAPS_LABEL}
          </label>
          <div className="relative flex items-center">
            <Globe size={16} className="absolute left-3.5 text-primary" />
            <Input
              variant="none"
              placeholder={LABELS.RESTAURANT.EDIT_MODAL.MAPS_PLACEHOLDER}
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
