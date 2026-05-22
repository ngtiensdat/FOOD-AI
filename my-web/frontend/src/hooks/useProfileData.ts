import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { parseAddressString } from '@/utils/helpers';

export const useProfileData = (targetId?: string | null) => {
  const { user: me, login: updateMe } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Modals States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any>({ users: [], restaurants: [] });
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorFollowers, setErrorFollowers] = useState<string | null>(null);
  const [errorFollowing, setErrorFollowing] = useState<string | null>(null);

  const fetchProfileData = useCallback(async (id: number, requesterId?: number) => {
    try {
      const data = await authService.getProfile(id, requesterId);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const idToFetch = targetId ? parseInt(targetId) : me?.id;
    if (idToFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProfileData(idToFetch, me?.id);
    }
    
    // Đóng modals tự động khi id profile mục tiêu thay đổi
    setShowFollowersModal(false);
    setShowFollowingModal(false);
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
          city: parsedAddress.city || 'Hà Nội',
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
      const { userId, id, city, district, street, ...payload } = editData;
      payload.address = `${street}, ${district}, ${city}`;
      await authService.updateProfile(payload);
      const newData = await fetchProfileData(profile.id, me?.id);
      
      if (me?.id === profile.id && newData) {
        updateMe({ ...me, name: newData.name, avatar: newData.profile?.avatar || null });
      }
      
      setIsEditing(false);
      toast.success(LABELS.SETTINGS.PROFILE.SAVE_SUCCESS);
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
      await fetchProfileData(profile.id, me.id);
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
    } catch (err: any) {
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
    } catch (err: any) {
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
