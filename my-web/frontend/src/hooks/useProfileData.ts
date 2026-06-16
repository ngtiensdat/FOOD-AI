// Mục đích file: Hook quản lý tải và thao tác dữ liệu hồ sơ cá nhân, bao gồm cập nhật thông tin và theo dõi (follow).
// Ý nghĩa: Đóng gói logic liên quan đến user profile, giúp các component như ProfilePage và FollowModal sạch sẽ hơn.
// Các chức năng đặc biệt: Tự động khởi tạo dữ liệu form (editData) khi có profile, xử lý logic đóng/mở modal follow.
// Các biến, hàm đặc biệt: ProfileEditState, ApiError, fetchProfileData, updateProfile, toggleFollow.

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { parseAddressString } from '@/utils/helpers';
import { User, UpdateProfileData } from '@/types/user';
import { DEFAULT_CITY } from '@/constants/location.constant';
import { addNotification } from '@/utils/notifications';

export interface ProfileEditState extends Omit<UpdateProfileData, 'id' | 'userId'> {
  name?: string;
  city?: string;
  district?: string;
  street?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useProfileData = (targetId?: string | null) => {
  const { user: me, login: updateMe } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileEditState>({});

  // Modals States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<{ users: User[], restaurants: User[] }>({ users: [], restaurants: [] });
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorFollowers, setErrorFollowers] = useState<string | null>(null);
  const [errorFollowing, setErrorFollowing] = useState<string | null>(null);

  const fetchProfileData = useCallback(async (id: number, requesterId?: number) => {
    try {
      return await authService.getProfile(id, requesterId);
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const idToFetch = targetId ? parseInt(targetId) : me?.id;
    if (idToFetch) {
      fetchProfileData(idToFetch, me?.id).then((data) => {
        if (active && data) {
          setProfile(data);
          // Sync profile to auth store if it is the current user to ensure points/level are initialized
          if (me?.id === data.id) {
            updateMe({
              ...me,
              points: data.points,
              level: data.level,
              badgeTitle: data.badgeTitle,
            });
          }
        }
      });
    }
    
    // Đóng modals tự động khi id profile mục tiêu thay đổi
    setShowFollowersModal(false);
    setShowFollowingModal(false);

    return () => {
      active = false;
    };
  }, [targetId, me?.id, fetchProfileData]);

  useEffect(() => {
    if (profile) {
      const parsedAddress = parseAddressString(profile.profile?.address);
      Promise.resolve().then(() => {
        setEditData({
          name: profile.name,
          fullName: profile.profile?.fullName || '',
          phone: profile.profile?.phone || '',
          avatar: profile.profile?.avatar || '',
          coverImage: profile.profile?.coverImage || '',
          bio: profile.profile?.bio || '',
          city: parsedAddress.city || DEFAULT_CITY,
          district: parsedAddress.district || '',
          street: parsedAddress.street || '',
          workAt: profile.profile?.workAt || '',
        });
      });
    }
  }, [profile]);

  const updateProfile = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { city, district, street, ...payload } = editData;
      const updatePayload: UpdateProfileData = {
        ...payload,
        address: `${street}, ${district}, ${city}`
      };
      await authService.updateProfile(updatePayload);
      const newData = await fetchProfileData(profile.id, me?.id);
      
      if (newData) {
        setProfile(newData);
        if (me?.id === profile.id) {
          updateMe({ ...me, name: newData.name, avatar: newData.profile?.avatar || null });
        }
      }
      
      setIsEditing(false);
      toast.success(LABELS.SETTINGS.PROFILE.SAVE_SUCCESS);
      addNotification(
        profile.id,
        LABELS.SETTINGS.PROFILE.NOTIFICATIONS.UPDATE_TITLE,
        LABELS.SETTINGS.PROFILE.NOTIFICATIONS.UPDATE_BODY,
        'PROFILE_UPDATE',
        '/chibi linh vật/nháy mắt.png'
      );
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      toast.error(LABELS.COMMON.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!me) {
      toast.error(LABELS.AUTH.LOGIN_REQUIRED);
      return;
    }
    if (!profile) return;
    
    setIsFollowLoading(true);
    try {
      await authService.toggleFollowUser({ followingId: profile.id });
      const newData = await fetchProfileData(profile.id, me.id);
      if (newData) setProfile(newData);
    } catch (error) {
      console.error('Lỗi follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openFollowersModal = async () => {
    if (!profile) return;
    setShowFollowersModal(true);
    setLoadingFollowers(true);
    setErrorFollowers(null);
    try {
      const data = await authService.getFollowers(profile.id);
      setFollowersList(data || []);
    } catch (error) {
      const err = error as ApiError;
      setErrorFollowers(err.response?.data?.message || LABELS.SETTINGS.PROFILE.MODALS.PRIVATE_LIST_ERROR);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const openFollowingModal = async () => {
    if (!profile) return;
    setShowFollowingModal(true);
    setLoadingFollowing(true);
    setErrorFollowing(null);
    try {
      const data = await authService.getFollowing(profile.id);
      setFollowingList(data || { users: [], restaurants: [] });
    } catch (error) {
      const err = error as ApiError;
      setErrorFollowing(err.response?.data?.message || LABELS.SETTINGS.PROFILE.MODALS.PRIVATE_LIST_ERROR);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return {
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
    actions: {
      updateProfile,
      toggleFollow,
      fetchProfileData,
      openFollowersModal,
      openFollowingModal,
      setProfile,
    },
    modals: {
      showFollowersModal, setShowFollowersModal,
      showFollowingModal, setShowFollowingModal,
      followersList, followingList,
      loadingFollowers, loadingFollowing,
      errorFollowers, errorFollowing,
    }
  };
};
