'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { restaurantService } from '@/services/restaurant.service';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';

export const useRestaurantProfile = () => {
  const params = useParams();
  const restaurantId = Number(params?.id);
  const { user, isAuthenticated } = useAuth();

  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'info'>('menu');
  
  // Follow States
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowList, setShowFollowList] = useState(true);

  // Modal States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [errorFollowers, setErrorFollowers] = useState<string | null>(null);
  const [errorFollowing, setErrorFollowing] = useState<string | null>(null);

  // Food detail modal state
  const [selectedFood, setSelectedFood] = useState<any>(null);

  const fetchProfile = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await restaurantService.getPublicProfile(restaurantId);
      setRestaurantData(data.restaurant);
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.stats.followersCount);
      setFollowingCount(data.stats.followingCount);
      setShowFollowList(data.stats.showFollowList);
    } catch (err) {
      console.error('Lỗi khi tải thông tin quán ăn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchProfile();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [restaurantId]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      alert(LABELS.RESTAURANT.PUBLIC_PROFILE.LOGIN_REQUIRED);
      return;
    }
    try {
      const result = await restaurantService.toggleFollow(restaurantId);
      setIsFollowing(result.followed);
      setFollowersCount(prev => result.followed ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Lỗi khi theo dõi/hủy theo dõi:', err);
    }
  };

  const openFollowersModal = async () => {
    if (!showFollowList && user?.id !== restaurantData?.ownerId) {
      alert(LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWERS_PRIVATE);
      return;
    }
    setShowFollowersModal(true);
    setLoadingFollowers(true);
    setErrorFollowers(null);
    try {
      const data = await restaurantService.getFollowers(restaurantId);
      setFollowersList(data || []);
    } catch (err: any) {
      setErrorFollowers(err.response?.data?.message || LABELS.RESTAURANT.PUBLIC_PROFILE.LOAD_ERROR);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const openFollowingModal = async () => {
    if (!showFollowList && user?.id !== restaurantData?.ownerId) {
      alert(LABELS.RESTAURANT.PUBLIC_PROFILE.FOLLOWING_PRIVATE);
      return;
    }
    setShowFollowingModal(true);
    setLoadingFollowing(true);
    setErrorFollowing(null);
    try {
      const data = await restaurantService.getFollowing(restaurantId);
      setFollowingList(data || []);
    } catch (err: any) {
      setErrorFollowing(err.response?.data?.message || LABELS.RESTAURANT.PUBLIC_PROFILE.LOAD_ERROR);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return {
    restaurantId,
    restaurantData,
    loading,
    activeTab,
    setActiveTab,
    isFollowing,
    followersCount,
    followingCount,
    showFollowList,
    handleToggleFollow,
    
    // Modal Followers
    showFollowersModal,
    setShowFollowersModal,
    followersList,
    loadingFollowers,
    errorFollowers,
    openFollowersModal,

    // Modal Following
    showFollowingModal,
    setShowFollowingModal,
    followingList,
    loadingFollowing,
    errorFollowing,
    openFollowingModal,

    // Food view details
    selectedFood,
    setSelectedFood,
    isAuthenticated,
    user,
  };
};
