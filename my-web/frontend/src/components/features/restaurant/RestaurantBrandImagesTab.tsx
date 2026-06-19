import React from 'react';
import { Image } from 'lucide-react';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface RestaurantBrandImagesTabProps {
  logo: string;
  setLogo: (val: string) => void;
  coverImage: string;
  setCoverImage: (val: string) => void;
  syncWithPersonalAvatar: boolean;
  setSyncWithPersonalAvatar: (val: boolean) => void;
  syncWithPersonalCover: boolean;
  setSyncWithPersonalCover: (val: boolean) => void;
}

export const RestaurantBrandImagesTab: React.FC<RestaurantBrandImagesTabProps> = ({
  logo,
  setLogo,
  coverImage,
  setCoverImage,
  syncWithPersonalAvatar,
  setSyncWithPersonalAvatar,
  syncWithPersonalCover,
  setSyncWithPersonalCover,
}) => {
  return (
    <div className="space-y-6">
      <div className="ai-box border p-4 rounded-card space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.LOGO_LABEL}
          </label>
          <Input
            icon={Image}
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.LOGO_PLACEHOLDER}
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Input
            type="checkbox"
            checked={syncWithPersonalAvatar}
            onChange={(e) => setSyncWithPersonalAvatar((e.target as HTMLInputElement).checked)}
            variant="none"
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
            {LABELS.RESTAURANT.EDIT_MODAL.SYNC_AVATAR}
          </span>
        </label>
      </div>

      <div className="ai-box border p-4 rounded-card space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
            {LABELS.RESTAURANT.EDIT_MODAL.COVER_LABEL}
          </label>
          <Input
            icon={Image}
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.COVER_PLACEHOLDER}
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Input
            type="checkbox"
            checked={syncWithPersonalCover}
            onChange={(e) => setSyncWithPersonalCover((e.target as HTMLInputElement).checked)}
            variant="none"
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
            {LABELS.RESTAURANT.EDIT_MODAL.SYNC_COVER}
          </span>
        </label>
      </div>
    </div>
  );
};
