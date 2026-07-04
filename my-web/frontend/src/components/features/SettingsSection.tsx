// Mục đích file này để làm gì: Component giao diện phần Cài đặt tài khoản (Settings) bao gồm Hồ sơ, Bảo mật, Xác thực và Xoá tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Là một màn hình con trong Dashboard/Profile của người dùng.
// Các chức năng đặc biệt: Chuyển tab qua lại giữa Profile/Security/Verification, cảnh báo Danger Zone, cập nhật preference.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: user prop, handleChangePassword, handleVerifyEmail, handleDeleteAccount, state settingsTab.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, Mail, Globe, AlertTriangle, Bug, Briefcase } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { useSettings } from '@/hooks/useSettings';
import { ProfileSettingsTab } from './profile/ProfileSettingsTab';
import { SecuritySettingsTab } from './profile/SecuritySettingsTab';
import { VerificationSettingsTab } from './profile/VerificationSettingsTab';
import { DangerZoneSection } from './profile/DangerZoneSection';
import { LanguageSettingsTab } from './profile/LanguageSettingsTab';
import { BugReportTab } from './profile/BugReportTab';
import { JobInvitationsTab } from './profile/JobInvitationsTab';
 
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
    <div className="p-layout max-w-6xl mx-auto min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-container p-6 md:p-8 shadow-2xl mt-8 flex flex-col md:flex-row gap-8"
      >
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
          <Button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all mb-2 text-sm self-start"
            variant="none"
            size="none"
          >
            <ArrowLeft size={18} /> {LABELS.COMMON.BACK_HOME}
          </Button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center text-primary text-xl shrink-0">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{LABELS.SETTINGS.TITLE}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{LABELS.SETTINGS.SUBTITLE}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 text-sm font-bold text-gray-500">
            {[
              { id: 'profile', label: LABELS.SETTINGS.TABS.PROFILE, icon: User },
              { id: 'security', label: LABELS.SETTINGS.TABS.SECURITY, icon: Lock },
              { id: 'verification', label: LABELS.SETTINGS.TABS.VERIFICATION, icon: Mail },
              { id: 'job_invitations', label: LABELS.SETTINGS.TABS.JOB_INVITATIONS, icon: Briefcase },
              { id: 'language', label: LABELS.SETTINGS.TABS.LANGUAGE, icon: Globe },
              { id: 'bug_report', label: LABELS.BUG_REPORT.TITLE, icon: Bug },
              { id: 'danger_zone', label: LABELS.SETTINGS.TABS.DANGER_ZONE, icon: AlertTriangle },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'profile' | 'security' | 'verification' | 'language' | 'bug_report' | 'danger_zone' | 'job_invitations')}
                className={`w-full py-2.5 px-4 rounded-xl transition-all flex items-center gap-3 font-semibold ${
                  settingsTab === tab.id 
                    ? 'text-primary bg-primary/5 border-l-4 border-primary pl-3' 
                    : 'hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-800/30'
                }`}
                variant="none"
                size="none"
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </Button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 md:p-4 min-h-[400px]">
            {settingsTab === 'profile' ? (
              <div className="space-y-6">
                <ProfileSettingsTab
                  user={user}
                  profileData={profileData}
                  setProfileData={setProfileData}
                />
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
            ) : settingsTab === 'verification' ? (
              <VerificationSettingsTab
                onVerifySubmit={onVerifySubmit}
                isEmailVerified={isEmailVerified}
                verifyEmail={verifyEmail}
                setVerifyEmail={setVerifyEmail}
                isLoading={isLoading}
              />
            ) : settingsTab === 'job_invitations' ? (
              <JobInvitationsTab />
            ) : settingsTab === 'language' ? (
              <LanguageSettingsTab />
            ) : settingsTab === 'bug_report' ? (
              <BugReportTab />
            ) : (
              <DangerZoneSection
                onDeleteSubmit={onDeleteSubmit}
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                deletePassword={deletePassword}
                setDeletePassword={setDeletePassword}
                isDeleting={isDeleting}
              />
            )}

            <div className="mt-8 pt-4 border-t border-gray-50 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setActiveTab('home')}>
                {LABELS.COMMON.BACK_HOME}
              </Button>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
};
