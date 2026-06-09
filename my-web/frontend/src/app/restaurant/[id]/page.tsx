/**
 * Mục đích file này để làm gì: Đây là trang Profile của Nhà hàng (Restaurant). Đóng vai trò Orchestrator quản lý toàn bộ các tính năng như hiển thị Header, Tab Menu (với Sidebar Category và Grid Món ăn), Tab Info, và các Modal theo dõi.
 * Các file khác hay file này có ý nghĩa như nào: Tách bạch rõ ràng logic và giao diện. Toàn bộ tính toán, quản lý state, API call đều được giấu trong `useRestaurantProfile`. Các Component hiển thị được đặt tại thư mục `features/`.
 * Các chức năng đặc biệt: Layout với 2 Tab (Menu và Info). Có Sidebar sticky để filter Category. Modal Follower/Following dùng chung logic.
 * Các biến, hàm đặc biệt trong file: Hook `useRestaurantProfile` điều phối chính. Component `RestaurantProfilePage` bọc ngoài cùng.
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, Info } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Services, Hooks & Components
import { useRestaurantProfile } from '@/hooks/useRestaurantProfile';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { FoodDetailModal } from '@/components/features/food/FoodDetailModal';
import { FollowersModal } from '@/components/features/profile/FollowersModal';
import { FollowingModal } from '@/components/features/profile/FollowingModal';
import { RestaurantHeaderCard } from '@/components/features/restaurant/RestaurantHeaderCard';
import { RestaurantInfoTab } from '@/components/features/restaurant/RestaurantInfoTab';
import { RestaurantMenuSidebar } from '@/components/features/restaurant/RestaurantMenuSidebar';
import { RestaurantFoodGrid } from '@/components/features/restaurant/RestaurantFoodGrid';

export default function RestaurantProfilePage() {
  const router = useRouter();

  // Local state for expanded categories & Scrollspy active category
  const [expandedCategories, setExpandedCategories] = React.useState<Record<number, boolean>>({});
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(null);

  const {
    restaurantData,
    loading,
    activeTab,
    setActiveTab,
    isFollowing,
    followersCount,
    followingCount,
    showFollowList,
    handleToggleFollow,
    
    // Category & Foods
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    foodsData,
    loadingFoods,
    hasMoreFoods,
    handleLoadMoreFoods,

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
  } = useRestaurantProfile();

  // Scrollspy logic
  React.useEffect(() => {
    if (activeTab !== 'menu' || selectedCategoryId !== null) {
      setActiveCategoryId(null);
      return;
    }

    const sections = document.querySelectorAll('.category-section');
    if (sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const catIdAttr = entry.target.getAttribute('data-category-id');
          if (catIdAttr) {
            const catId = catIdAttr === 'uncategorized' ? null : Number(catIdAttr);
            setActiveCategoryId(catId);
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [activeTab, selectedCategoryId, foodsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="loading-spinner w-12 h-12"></div>
        <p className="text-gray-500 font-bold text-body">{LABELS.COMMON.LOADING}</p>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-h2 text-gray-900 text-center">{LABELS.RESTAURANT.PUBLIC_PROFILE.NOT_FOUND}</h2>
        <p className="text-gray-500 text-center max-w-md">{LABELS.RESTAURANT.PUBLIC_PROFILE.NOT_FOUND_DESC}</p>
        <Button onClick={() => router.push('/')} variant="primary">
          {LABELS.COMMON.BACK_HOME}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === restaurantData.ownerId;

  return (
    <div className="page-container min-h-screen">
      <Navbar activeTab="explore" setActiveTab={(tab) => {
        if (tab === 'home') router.push('/');
        else router.push(`/?tab=${tab}`);
      }} />

      <RestaurantHeaderCard
        restaurantData={restaurantData}
        isOwner={isOwner}
        isFollowing={isFollowing}
        followersCount={followersCount}
        followingCount={followingCount}
        showFollowList={showFollowList}
        handleToggleFollow={handleToggleFollow}
        openFollowersModal={openFollowersModal}
        openFollowingModal={openFollowingModal}
        onBack={() => router.back()}
      />

      <div className="max-w-7xl mx-auto px-6 mt-12 pb-12">
        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-4 px-6 font-extrabold text-body transition-all duration-300 flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === 'menu'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Utensils size={18} />
            <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.MENU_TAB}</span>
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 px-6 font-extrabold text-body transition-all duration-300 flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Info size={18} />
            <span>{LABELS.RESTAURANT.PUBLIC_PROFILE.INFO_TAB}</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'menu' ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <RestaurantMenuSidebar 
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              expandedCategories={expandedCategories}
              setExpandedCategories={setExpandedCategories}
              activeCategoryId={activeCategoryId}
            />
            <RestaurantFoodGrid 
              foodsData={foodsData}
              loadingFoods={loadingFoods}
              hasMoreFoods={hasMoreFoods}
              restaurantData={restaurantData}
              handleLoadMoreFoods={handleLoadMoreFoods}
              setSelectedFood={setSelectedFood}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
            />
          </div>
        ) : (
          <RestaurantInfoTab restaurantData={restaurantData} />
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedFood && (
        <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}

      {/* Modal Followers */}
      <AnimatePresence>
        {showFollowersModal && (
          <FollowersModal
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            loading={loadingFollowers}
            error={errorFollowers}
            followersList={followersList}
            onItemClick={(followerUser: any) => {
              setShowFollowersModal(false);
              router.push(`/profile?id=${followerUser.id}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal Following */}
      <AnimatePresence>
        {showFollowingModal && (
          <FollowingModal
            isOpen={showFollowingModal}
            onClose={() => setShowFollowingModal(false)}
            loading={loadingFollowing}
            error={errorFollowing}
            restaurants={followingList.map((item) => item.restaurant)}
            onRestaurantClick={(restaurantItem: any) => {
              setShowFollowingModal(false);
              router.push(`/restaurant/${restaurantItem.id}`);
            }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
