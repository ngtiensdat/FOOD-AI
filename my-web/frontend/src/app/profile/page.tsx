'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

// Services & Components
import { useProfileData } from '@/hooks/useProfileData';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';

// Modular Feature Components
import { ProfileHeader } from '@/components/features/ProfileHeader';
import { ProfileIntro } from '@/components/features/ProfileIntro';
import { EditProfileModal } from '@/components/features/EditProfileModal';

function ProfileContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const {
    me,
    profile,
    loading,
    isFollowLoading,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    actions
  } = useProfileData(targetId);

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
    </div>
  );

  const user = profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab="profile" setActiveTab={() => {}} />

      <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 md:px-6">
        <ProfileHeader 
          user={user} 
          profile={profile} 
          me={me} 
          isFollowLoading={isFollowLoading} 
          onEdit={() => setIsEditing(true)} 
          onFollow={actions.toggleFollow} 
        />

        <div className="flex items-center mt-6 border-b border-gray-100 bg-white rounded-t-card px-4 md:px-8">
          {[
            { id: 'posts', label: LABELS.SETTINGS.PROFILE.TABS.POSTS },
            { id: 'about', label: LABELS.SETTINGS.PROFILE.TABS.ABOUT },
            { id: 'friends', label: LABELS.SETTINGS.PROFILE.TABS.FRIENDS },
            { id: 'photos', label: LABELS.SETTINGS.PROFILE.TABS.PHOTOS },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-8 py-4 font-bold text-small transition-all border-b-4 ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          <div className="md:col-span-5 space-y-6">
            <ProfileIntro profile={profile} user={user} me={me} onEdit={() => setIsEditing(true)} />
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="card-container !p-6">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white font-bold">
                  {profile.profile?.avatar ? (
                    <img src={profile.profile.avatar} className="w-full h-full object-cover" />
                  ) : user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-full px-6 py-2 text-left text-gray-500 transition-all text-small">
                  {LABELS.SETTINGS.PROFILE.POSTS.THINKING(user.name)}
                </button>
              </div>
            </div>

            <div className="card-container !p-12 text-center border-2 border-dashed !border-gray-100">
               <Info size={48} className="mx-auto text-gray-200 mb-4" />
               <h3 className="text-lg font-bold text-gray-400">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_TITLE}</h3>
               <p className="text-gray-400 text-small">{LABELS.SETTINGS.PROFILE.POSTS.EMPTY_DESC}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <EditProfileModal 
            isOpen={isEditing} 
            onClose={() => setIsEditing(false)} 
            editData={editData} 
            setEditData={setEditData} 
            loading={loading} 
            onSave={actions.updateProfile} 
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-gray-400 font-bold animate-pulse">{LABELS.COMMON.LOADING}</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
