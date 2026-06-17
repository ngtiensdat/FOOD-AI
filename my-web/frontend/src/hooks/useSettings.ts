// Mục đích file này để làm gì: Custom Hook quản lý trạng thái và các hành vi nghiệp vụ cho phân hệ Cài đặt tài khoản (Settings).
// Các file khác hay file này có ý nghĩa như nào: Đóng gói 11 state, xử lý gọi API cập nhật mật khẩu, xác thực email, xóa tài khoản và lấy thông tin profile của người dùng.
// Các chức năng đặc biệt: Xử lý thay đổi tab, lấy dữ liệu hồ sơ cá nhân và theo dõi, kiểm soát trạng thái xác thực và xóa tài khoản.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Custom Hook Pattern, State encapsulation, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: useSettings, onDeleteSubmit, onPasswordSubmit, onVerifySubmit, handleTabChange.
import { useState, useEffect } from 'react';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { authService } from '@/services/auth.service';

export interface UseSettingsProps {
  user: { id?: string | number; name?: string; email?: string; role?: string; [key: string]: unknown } | null;
  handleChangePassword: (e: React.FormEvent, data: Record<string, string>) => Promise<void>;
  handleVerifyEmail: (e: React.FormEvent, email: string) => Promise<void>;
  fetchUserProfile: () => Promise<void | Record<string, unknown>>;
  handleDeleteAccount: (password: string) => Promise<void>;
}

export function useSettings({
  user,
  handleChangePassword,
  handleVerifyEmail,
  fetchUserProfile,
  handleDeleteAccount,
}: UseSettingsProps) {
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'verification' | 'language' | 'bug_report' | 'danger_zone'>('profile');
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
  const [profileData, setProfileData] = useState<{ profile?: { preferences?: { showFollowList?: boolean, showPersonalInfo?: boolean } }; [key: string]: unknown } | null>(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('showPersonalInfo');
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    if (settingsTab === 'profile' && user?.id) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const data = await authService.getProfile(Number(user.id));
          setProfileData(data);
        } catch (err) {
          console.error('Error fetching profile:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user?.id, settingsTab]);

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
      setShowDeleteModal(false);
      setDeletePassword('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
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
    } catch (error: unknown) {
      const err = error as { message?: string };
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || LABELS.COMMON.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tabId: 'profile' | 'security' | 'verification' | 'language' | 'bug_report' | 'danger_zone') => {
    setSettingsTab(tabId);
    if (tabId === 'verification') {
      fetchUserProfile();
    }
    if (tabId === 'profile' && user?.id) {
      setIsLoading(true);
      try {
        const data = await authService.getProfile(Number(user.id));
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
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
    showPersonalInfo,
    setShowPersonalInfo,
    setProfileData,
    onDeleteSubmit,
    onPasswordSubmit,
    onVerifySubmit,
    handleTabChange,
  };
}
