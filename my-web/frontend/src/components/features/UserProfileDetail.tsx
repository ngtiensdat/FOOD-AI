'use client';

import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface UserProfileDetailProps {
  profile: any;
  onUpdatePreferences: () => void;
}

export const UserProfileDetail = ({ profile, onUpdatePreferences }: UserProfileDetailProps) => {
  return (
    <section className="card-container p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-gray-800">{LABELS.CUSTOMER.INFO}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onUpdatePreferences}>
            <Sparkles size={16} className="mr-2" /> {LABELS.CUSTOMER.UPDATE_PREFERENCES}
          </Button>
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl" aria-label={LABELS.COMMON.OTHER}>
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-small">
        <div>
          <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {LABELS.FORM.EMAIL}
          </label>
          <p className="font-bold text-gray-700">{profile?.email}</p>
        </div>
        <div>
          <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {LABELS.FORM.PHONE}
          </label>
          <p className="font-bold text-gray-700">{profile?.profile?.phone || LABELS.FORM.NOT_SET}</p>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {LABELS.CUSTOMER.AI_CONTEXT}
          </label>
          <p className="font-bold text-gray-700 italic">
            {profile?.profile?.preferences 
              ? Object.values(profile.profile.preferences).join(', ') 
              : LABELS.FORM.NO_PREFERENCES}
          </p>
        </div>
      </div>
    </section>
  );
};
