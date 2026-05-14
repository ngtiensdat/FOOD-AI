import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

export const useProfileData = (targetId?: string | null) => {
  const { user: me, login: updateMe } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

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
  }, [targetId, me?.id, fetchProfileData]);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditData({
        name: profile.name,
        fullName: profile.profile?.fullName || '',
        phone: profile.profile?.phone || '',
        avatar: profile.profile?.avatar || '',
        coverImage: profile.profile?.coverImage || '',
        bio: profile.profile?.bio || '',
        address: profile.profile?.address || '',
        workAt: profile.profile?.workAt || '',
      });
    }
  }, [profile]);

  const updateProfile = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { userId, id, ...payload } = editData;
      await authService.updateProfile(payload);
      const newData = await fetchProfileData(profile.id, me?.id);
      
      if (me?.id === profile.id && newData) {
        updateMe({ ...me, name: newData.name });
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
      fetchProfileData
    }
  };
};
