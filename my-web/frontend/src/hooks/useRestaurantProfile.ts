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
  
  // Category & Foods state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [foodsData, setFoodsData] = useState<any[]>([]);
  const [foodPage, setFoodPage] = useState(1);
  const [hasMoreFoods, setHasMoreFoods] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(false);

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
      const [profileData, hierarchyData] = await Promise.all([
        restaurantService.getPublicProfile(restaurantId),
        import('@/services/category.service').then(m => m.categoryService.getPublicHierarchy(restaurantId))
      ]);
      setRestaurantData(profileData.restaurant);
      setIsFollowing(profileData.isFollowing);
      setFollowersCount(profileData.stats.followersCount);
      setFollowingCount(profileData.stats.followingCount);
      setShowFollowList(profileData.stats.showFollowList);
      setCategories(hierarchyData);
    } catch (err) {
      console.error('Lỗi khi tải thông tin quán ăn:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async (page: number, catId: number | null, append: boolean = false) => {
    if (!restaurantId) return;
    setLoadingFoods(true);
    try {
      const pageSize = 8;
      const res: any = await restaurantService.getPublicRestaurantFoods(restaurantId, catId || undefined, page, pageSize);
      if (res && Array.isArray(res.items)) {
        setFoodsData(prev => append ? [...prev, ...res.items] : res.items);
        const hasNext = (res.page * res.pageSize) < res.total;
        setHasMoreFoods(hasNext);
      } else {
        console.error('Cấu trúc phản hồi từ API getPublicRestaurantFoods không hợp lệ hoặc thiếu mảng "items":', res);
        setFoodsData([]);
        setHasMoreFoods(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải món ăn:', err);
      setFoodsData([]);
      setHasMoreFoods(false);
    } finally {
      setLoadingFoods(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchProfile();
        fetchFoods(1, selectedCategoryId, false);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFoodPage(1);
      fetchFoods(1, selectedCategoryId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const handleLoadMoreFoods = () => {
    const nextPage = foodPage + 1;
    setFoodPage(nextPage);
    fetchFoods(nextPage, selectedCategoryId, true);
  };

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

    // Category & Foods
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    foodsData,
    loadingFoods,
    hasMoreFoods,
    handleLoadMoreFoods,

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
