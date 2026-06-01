import React from 'react';
import { RefreshCw, Image, Check, MapPin, Clock, Store } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

interface RestaurantLivePreviewProps {
  name: string;
  bio: string;
  coverImage: string;
  logo: string;
  district: string;
  city: string;
  openingHours: string;
}

export const RestaurantLivePreview: React.FC<RestaurantLivePreviewProps> = ({
  name,
  bio,
  coverImage,
  logo,
  district,
  city,
  openingHours,
}) => {
  return (
    <div className="w-full md:w-5/12 bg-gray-50 dark:bg-slate-950 p-6 flex flex-col justify-between border-r border-gray-100 dark:border-slate-800 overflow-y-auto">
      <div>
        <h4 className="text-small font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-primary" /> {LABELS.RESTAURANT.EDIT_MODAL.LIVE_PREVIEW}
        </h4>

        {/* RestaurantCard Live Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-card overflow-hidden border border-gray-100 dark:border-slate-800 shadow-lg group relative">
          <div className="h-32 bg-gray-200 dark:bg-slate-800 relative overflow-hidden">
            {coverImage ? (
              <SafeImage
                src={coverImage}
                alt="Cover Preview"
                className="w-full h-full object-cover transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-100 to-amber-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <Image size={32} className="text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="px-5 pb-5 pt-10 relative">
            {/* Logo Preview */}
            <div className="absolute -top-10 left-5 w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 overflow-hidden shadow-md bg-white">
              {logo ? (
                <SafeImage
                  src={logo}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center">
                  <Store size={32} className="text-primary" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-start mb-2">
              <h3 className="text-h3 font-bold text-gray-900 dark:text-white truncate max-w-[70%]">
                {name || LABELS.RESTAURANT.EDIT_MODAL.NAME_LABEL}
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 shrink-0 flex items-center gap-0.5">
                <Check size={10} /> {LABELS.RESTAURANT.EDIT_MODAL.VERIFIED}
              </span>
            </div>

            <p className="text-xs text-gray-400 dark:text-slate-400 italic mb-4 truncate">
              {bio || LABELS.RESTAURANT.EDIT_MODAL.BIO_PLACEHOLDER}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400 mb-4 border-t border-gray-50 dark:border-slate-800/50 pt-3">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                <span>
                  {district || LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT_PLACEHOLDER},{' '}
                  {city || LABELS.SETTINGS.PROFILE.EDIT_MODAL.CITY}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Clock size={12} className="text-primary" />
                <span>{openingHours || LABELS.RESTAURANT.EDIT_MODAL.NOT_OPENED}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-400 dark:text-slate-500 leading-relaxed border-t border-gray-100 dark:border-slate-800 pt-4">
        {LABELS.RESTAURANT.EDIT_MODAL.TIP}
      </div>
    </div>
  );
};
