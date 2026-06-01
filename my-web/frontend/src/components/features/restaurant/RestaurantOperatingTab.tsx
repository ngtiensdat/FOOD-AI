import React from 'react';
import { MapPin, Clock, Phone, Mail, Globe } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.CITY_LABEL}
          </label>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-card px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm w-full">
            <MapPin size={18} className="text-primary shrink-0" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full cursor-pointer text-slate-800 dark:text-slate-100"
            >
              {LOCATION_DATA.map((c) => (
                <option key={c.value} value={c.value} className="text-slate-900 bg-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.DISTRICT_LABEL}
          </label>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-card px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm w-full">
            <MapPin size={18} className="text-primary shrink-0" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full cursor-pointer text-slate-800 dark:text-slate-100"
            >
              {LOCATION_DATA.find((c) => c.value === city)
                ?.districts.map((d) => (
                  <option key={d.value} value={d.value} className="text-slate-900 bg-white">
                    {d.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
          {LABELS.RESTAURANT.EDIT_MODAL.ADDRESS_LABEL}
        </label>
        <Input
          icon={MapPin}
          placeholder={LABELS.RESTAURANT.EDIT_MODAL.ADDRESS_PLACEHOLDER}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.HOURS_LABEL}
          </label>
          <Input
            icon={Clock}
            placeholder={LABELS.RESTAURANT.HOURS_PLACEHOLDER}
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.PHONE_LABEL}
          </label>
          <Input
            icon={Phone}
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.PHONE_PLACEHOLDER}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.EMAIL_LABEL}
          </label>
          <Input
            icon={Mail}
            type="email"
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.EMAIL_PLACEHOLDER}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.MAPS_LABEL}
          </label>
          <Input
            icon={Globe}
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.MAPS_PLACEHOLDER}
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
