import React from 'react';
import { Store, User } from 'lucide-react';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

interface RestaurantBasicInfoTabProps {
  name: string;
  setName: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
}

export const RestaurantBasicInfoTab: React.FC<RestaurantBasicInfoTabProps> = ({
  name,
  setName,
  bio,
  setBio,
  description,
  setDescription,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
          {LABELS.RESTAURANT.EDIT_MODAL.NAME_LABEL} <span className="text-rose-500">*</span>
        </label>
        <div className="relative flex items-center">
          <Store size={16} className="absolute left-3.5 text-primary" />
          <Input
            variant="none"
            required
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
          {LABELS.RESTAURANT.EDIT_MODAL.BIO_LABEL}
        </label>
        <div className="relative flex items-center">
          <User size={16} className="absolute left-3.5 text-primary" />
          <Input
            variant="none"
            placeholder={LABELS.RESTAURANT.EDIT_MODAL.BIO_INPUT_PLACEHOLDER}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-0.5">
          {LABELS.RESTAURANT.EDIT_MODAL.DESC_LABEL}
        </label>
        <Input
          isTextArea
          variant="none"
          placeholder={LABELS.RESTAURANT.EDIT_MODAL.DESC_PLACEHOLDER}
          value={description}
          onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          rows={3}
          className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
        />
      </div>
    </div>
  );
};
