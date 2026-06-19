import React from 'react';
import { RefreshCw, Image, Check, MapPin, Clock, Store } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { ExpandableText } from '@/components/base/ExpandableText';
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
        <div className="card-restaurant overflow-hidden shadow-lg group relative h-[310px] w-full flex flex-col justify-between">
          <div className="h-28 bg-gray-200 dark:bg-slate-800 relative overflow-hidden shrink-0">
            {coverImage ? (
              <SafeImage
                src={coverImage}
                alt="Cover Preview"
                fill
                className="w-full h-full object-cover transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-100 to-amber-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <Image size={28} className="text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="px-4 pb-3 pt-6 relative flex-1 flex flex-col justify-between overflow-hidden">
            {/* Logo Preview */}
            <div className="absolute -top-8 left-4 w-12 h-12 rounded-xl border-2 border-white dark:border-slate-900 overflow-hidden shadow-md bg-white shrink-0">
              {logo ? (
                <SafeImage
                  src={logo}
                  alt="Logo Preview"
                  fill
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center">
                  <Store size={20} className="text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-0.5 gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[70%]">
                    {name || LABELS.RESTAURANT.EDIT_MODAL.NAME_LABEL}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 shrink-0 flex items-center gap-0.5">
                    <Check size={8} /> {LABELS.RESTAURANT.EDIT_MODAL.VERIFIED}
                  </span>
                </div>

                <ExpandableText
                  text={bio || LABELS.RESTAURANT.EDIT_MODAL.BIO_PLACEHOLDER}
                  collapsedLines={2}
                  threshold={86}
                  className="mb-2 min-h-[2.5rem]"
                  textClassName="text-[11px] text-gray-400 dark:text-slate-400 italic leading-normal"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-slate-400 mb-2 border-t border-gray-50 dark:border-slate-800/50 pt-2 shrink-0 justify-between items-center mt-auto">
                <div className="flex items-center gap-1 truncate max-w-[60%]">
                  <MapPin size={11} className="text-primary shrink-0" />
                  <span className="truncate">
                    {district || LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT_PLACEHOLDER},{' '}
                    {city || LABELS.SETTINGS.PROFILE.EDIT_MODAL.CITY}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock size={11} className="text-primary" />
                  <span className="truncate">{openingHours || LABELS.RESTAURANT.EDIT_MODAL.NOT_OPENED}</span>
                </div>
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
