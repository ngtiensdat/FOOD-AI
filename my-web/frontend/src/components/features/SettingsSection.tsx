// Mục đích file này để làm gì: Component giao diện phần Cài đặt tài khoản (Settings) bao gồm Hồ sơ, Bảo mật, Xác thực và Xoá tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Là một màn hình con trong Dashboard/Profile của người dùng.
// Các chức năng đặc biệt: Chuyển tab qua lại giữa Profile/Security/Verification, cảnh báo Danger Zone, cập nhật preference.
// Các biến, hàm đặc biệt trong file: user prop, handleChangePassword, handleVerifyEmail, handleDeleteAccount, state settingsTab.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { useSettings } from '@/hooks/useSettings';
import { ProfileSettingsTab } from './profile/ProfileSettingsTab';
import { SecuritySettingsTab } from './profile/SecuritySettingsTab';
import { VerificationSettingsTab } from './profile/VerificationSettingsTab';
import { DangerZoneSection } from './profile/DangerZoneSection';

interface SettingsSectionProps {
  user: { id?: string | number; name?: string; email?: string; role?: string; [key: string]: unknown } | null;
  setActiveTab: (tab: string) => void;
  handleChangePassword: (e: React.FormEvent, data: Record<string, string>) => Promise<void>;
  handleVerifyEmail: (e: React.FormEvent, email: string) => Promise<void>;
  fetchUserProfile: () => Promise<void | Record<string, unknown>>;
  isEmailVerified: boolean | null;
  handleDeleteAccount: (password: string) => Promise<void>;
}

export const SettingsSection = ({
  user,
  setActiveTab,
  handleChangePassword,
  handleVerifyEmail,
  fetchUserProfile,
  isEmailVerified,
  handleDeleteAccount,
}: SettingsSectionProps) => {
  const {
    settingsTab,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    verifyEmail,
    setVerifyEmail,
    isLoading,
    showDeleteModal,
    setShowDeleteModal,
    deletePassword,
    setDeletePassword,
    isDeleting,
    profileData,
    setProfileData,
    onDeleteSubmit,
    onPasswordSubmit,
    onVerifySubmit,
    handleTabChange,
  } = useSettings({
    user,
    handleChangePassword,
    handleVerifyEmail,
    fetchUserProfile,
    handleDeleteAccount,
  });

  return (
    <div className="p-layout max-w-4xl mx-auto min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-container p-8 md:p-10 shadow-2xl mt-8"
      >
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all mb-6 text-sm"
        >
          <ArrowLeft size={18} /> {LABELS.COMMON.BACK_HOME}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary text-2xl">
            ⚙️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{LABELS.SETTINGS.TITLE}</h2>
            <p className="text-sm text-gray-500 text-body">{LABELS.SETTINGS.SUBTITLE}</p>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-gray-100 mb-8 gap-6 text-sm font-bold text-gray-500">
          {[
            { id: 'profile', label: LABELS.SETTINGS.TABS.PROFILE, icon: User },
            { id: 'security', label: LABELS.SETTINGS.TABS.SECURITY, icon: Lock },
            { id: 'verification', label: LABELS.SETTINGS.TABS.VERIFICATION, icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'profile' | 'security' | 'verification')}
              className={`pb-3 transition-all flex items-center gap-2 ${settingsTab === tab.id ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {settingsTab === 'profile' ? (
          <div className="space-y-6">
            <ProfileSettingsTab
              user={user}
              profileData={profileData}
              setProfileData={setProfileData}
            />

            <DangerZoneSection
              onDeleteSubmit={onDeleteSubmit}
              showDeleteModal={showDeleteModal}
              setShowDeleteModal={setShowDeleteModal}
              deletePassword={deletePassword}
              setDeletePassword={setDeletePassword}
              isDeleting={isDeleting}
            />

            <Button variant="ghost" onClick={() => setActiveTab('home')}>
              {LABELS.COMMON.BACK_HOME}
            </Button>
          </div>
        ) : settingsTab === 'security' ? (
          <SecuritySettingsTab
            onPasswordSubmit={onPasswordSubmit}
            oldPassword={oldPassword}
            setOldPassword={setOldPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
            showOldPassword={showOldPassword}
            setShowOldPassword={setShowOldPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmNewPassword={showConfirmNewPassword}
            setShowConfirmNewPassword={setShowConfirmNewPassword}
            isLoading={isLoading}
            setActiveTab={setActiveTab}
          />
        ) : (
          <VerificationSettingsTab
            onVerifySubmit={onVerifySubmit}
            isEmailVerified={isEmailVerified}
            verifyEmail={verifyEmail}
            setVerifyEmail={setVerifyEmail}
            isLoading={isLoading}
          />
        )}
      </motion.div>
    </div>
  );
};
