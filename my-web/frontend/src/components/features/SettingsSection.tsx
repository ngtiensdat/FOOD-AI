'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { authService } from '@/services/auth.service';

interface SettingsSectionProps {
  user: any;
  setActiveTab: (tab: any) => void;
  handleChangePassword: (e: React.FormEvent, data: any) => Promise<void>;
  handleVerifyEmail: (e: React.FormEvent, email: string) => Promise<void>;
  fetchUserProfile: () => Promise<any>;
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
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'verification'>('security');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const onDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error(LABELS.SETTINGS.DANGER_ZONE.TOAST_PASSWORD_REQUIRED);
      return;
    }
    setIsDeleting(true);
    try {
      await handleDeleteAccount(deletePassword);
      toast.success(LABELS.SETTINGS.DANGER_ZONE.TOAST_SUCCESS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || LABELS.SETTINGS.DANGER_ZONE.TOAST_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast.error(LABELS.SETTINGS.SECURITY.MISMATCH);
      return;
    }
 
    setIsLoading(true);
    try {
      await handleChangePassword(e, { oldPassword, newPassword });
      toast.success(LABELS.SETTINGS.SECURITY.CHANGE_SUCCESS);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || LABELS.COMMON.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleVerifyEmail(e, verifyEmail);
      toast.success(LABELS.SETTINGS.VERIFICATION.SUCCESS);
    } catch (err: any) {
      toast.error(err.message || LABELS.COMMON.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

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
              onClick={async () => {
                setSettingsTab(tab.id as any);
                if (tab.id === 'verification') fetchUserProfile();
                if (tab.id === 'profile' && user?.id) {
                  setIsLoading(true);
                  try {
                    const data = await authService.getProfile(user.id);
                    setProfileData(data);
                  } catch (err) {
                    console.error('Lỗi khi lấy thông tin profile:', err);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              className={`pb-3 transition-all flex items-center gap-2 ${
                settingsTab === tab.id ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>



        {settingsTab === 'profile' ? (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-gray-50 p-6 rounded-card border border-gray-100 space-y-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <User className="text-primary" size={20} /> {LABELS.SETTINGS.PROFILE.TITLE}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold mb-1">{LABELS.SETTINGS.PROFILE.FULL_NAME}</span>
                  <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                    {user?.name || LABELS.SETTINGS.PROFILE.NOT_UPDATED}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-semibold mb-1">Email</span>
                  <p className="font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                    {user?.email || LABELS.SETTINGS.PROFILE.NOT_UPDATED}
                  </p>
                </div>
              </div>
            </div>

            {user?.role === 'RESTAURANT' && (
              <div className="bg-gray-50 p-6 rounded-card border border-gray-100 space-y-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  {LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_TITLE}
                </h3>
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
                  <div className="pr-4">
                    <span className="font-bold text-gray-700 block mb-0.5">{LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_LABEL}</span>
                    <span className="text-xs text-gray-400 font-medium">{LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_DESC}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={profileData?.profile?.preferences?.showFollowList !== false}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        try {
                          await authService.updateProfile({
                            preferences: { showFollowList: checked }
                          });
                          toast.success(LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_SUCCESS);
                          setProfileData((prev: any) => ({
                            ...prev,
                            profile: {
                              ...prev?.profile,
                              preferences: {
                                ...prev?.profile?.preferences,
                                showFollowList: checked
                              }
                            }
                          }));
                        } catch (err: any) {
                          toast.error(LABELS.RESTAURANT.PUBLIC_PROFILE.PRIVACY_ERROR);
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Vùng nguy hiểm (Danger Zone) */}
            <div className="bg-red-50/40 p-6 rounded-card border border-red-200/60 space-y-4">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                {LABELS.SETTINGS.DANGER_ZONE.TITLE}
              </h3>
              <p className="text-xs text-red-500 font-medium leading-relaxed">
                {LABELS.SETTINGS.DANGER_ZONE.WARNING}
              </p>
              <Button 
                onClick={() => setShowDeleteModal(true)} 
                variant="red"
                size="sm"
              >
                {LABELS.SETTINGS.DANGER_ZONE.BUTTON}
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setActiveTab('home')}>
              {LABELS.COMMON.BACK_HOME}
            </Button>
          </div>
        ) : settingsTab === 'security' ? (
          <form onSubmit={onPasswordSubmit} className="space-y-6 max-w-2xl">
            {[
              { label: LABELS.SETTINGS.SECURITY.CURRENT_PASSWORD, value: oldPassword, setter: setOldPassword, show: showOldPassword, toggle: setShowOldPassword },
              { label: LABELS.SETTINGS.SECURITY.NEW_PASSWORD, value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: setShowNewPassword },
              { label: LABELS.SETTINGS.SECURITY.CONFIRM_PASSWORD, value: confirmNewPassword, setter: setConfirmNewPassword, show: showConfirmNewPassword, toggle: setShowConfirmNewPassword },
            ].map((field, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-small font-semibold text-gray-700 ml-1">{field.label}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={field.show ? 'text' : 'password'}
                    required
                    placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
                    className="w-full bg-gray-50 border border-gray-200 rounded-input py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => field.toggle(!field.show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {field.show ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" loading={isLoading} fullWidth>
                {LABELS.SETTINGS.SECURITY.CHANGE_PASSWORD}
              </Button>
              <Button variant="outline" fullWidth onClick={() => setActiveTab('home')}>
                {LABELS.COMMON.CANCEL}
              </Button>
            </div>
          </form>
        ) : (
          <div className="max-w-2xl space-y-6">
            <div className="bg-gray-50 p-6 rounded-card border border-gray-100 space-y-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Mail className="text-primary" size={20} /> {LABELS.SETTINGS.VERIFICATION.TITLE}
              </h3>
              {isEmailVerified === true ? (
                <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 mb-0 font-bold text-sm flex items-center gap-2">
                  ✅ {LABELS.SETTINGS.VERIFICATION.VERIFIED}
                </div>
              ) : (
                <form onSubmit={onVerifySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-semibold ml-1">{LABELS.SETTINGS.VERIFICATION.LABEL}</label>
                    <input
                      type="email"
                      required
                      placeholder={LABELS.FORM.PLACEHOLDERS.EMAIL}
                      className="w-full bg-white border border-gray-200 rounded-input py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm font-medium"
                      value={verifyEmail}
                      onChange={(e) => setVerifyEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" loading={isLoading} fullWidth>
                    {LABELS.SETTINGS.VERIFICATION.VERIFY_NOW}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal xác nhận xóa tài khoản */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeletePassword('');
              }
            }} 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-card max-w-md relative z-10 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl rotate-3 shadow-inner">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-800">{LABELS.SETTINGS.DANGER_ZONE.MODAL_TITLE}</h3>
              <p className="text-xs text-red-500 font-semibold leading-relaxed px-2">
                {LABELS.SETTINGS.DANGER_ZONE.MODAL_WARNING}
              </p>
            </div>

            <form onSubmit={onDeleteSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">
                  {LABELS.SETTINGS.DANGER_ZONE.PASSWORD_LABEL}
                </label>
                <input
                  type="password"
                  required
                  placeholder={LABELS.SETTINGS.DANGER_ZONE.PASSWORD_PLACEHOLDER}
                  className="w-full bg-gray-50 border border-gray-200 rounded-input py-3.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all text-sm font-medium"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                >
                  {LABELS.SETTINGS.DANGER_ZONE.CANCEL_BUTTON}
                </Button>
                <Button 
                  type="submit" 
                  loading={isDeleting} 
                  variant="red"
                  className="flex-1"
                >
                  {LABELS.SETTINGS.DANGER_ZONE.CONFIRM_BUTTON}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
