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
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
          {LABELS.RESTAURANT.EDIT_MODAL.NAME_LABEL} <span className="text-rose-500">*</span>
        </label>
        <Input
          icon={Store}
          required
          placeholder={LABELS.RESTAURANT.EDIT_MODAL.NAME_PLACEHOLDER}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
          {LABELS.RESTAURANT.EDIT_MODAL.BIO_LABEL}
        </label>
        <Input
          icon={User}
          placeholder={LABELS.RESTAURANT.EDIT_MODAL.BIO_INPUT_PLACEHOLDER}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
          {LABELS.RESTAURANT.EDIT_MODAL.DESC_LABEL}
        </label>
        <Input
          isTextArea
          variant="none"
          placeholder={LABELS.RESTAURANT.EDIT_MODAL.DESC_PLACEHOLDER}
          value={description}
          onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          rows={4}
          className="form-input rounded-card px-4 py-3 text-sm text-gray-800 resize-none"
        />
      </div>
    </div>
  );
};
