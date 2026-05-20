'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, Info } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Services, Hooks & Components
import { useRestaurantProfile } from '@/hooks/useRestaurantProfile';
import { FoodCard } from '@/components/features/FoodCard';
import { FoodDetailModal } from '@/components/features/FoodDetailModal';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { FollowersModal } from '@/components/features/FollowersModal';
import { FollowingModal } from '@/components/features/FollowingModal';
import { RestaurantHeaderCard } from '@/components/features/RestaurantHeaderCard';
import { RestaurantInfoTab } from '@/components/features/RestaurantInfoTab';

export default function RestaurantProfilePage() {
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-gray-50 text-foreground transition-colors duration-300">
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
          <div>
            {!restaurantData.foods || restaurantData.foods.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-card border border-dashed border-gray-200 dark:border-slate-800 shadow-sm">
                <Utensils size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
                <h3 className="text-h3 text-gray-900 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.EMPTY_MENU}</h3>
                <p className="text-gray-400 text-small">{LABELS.RESTAURANT.PUBLIC_PROFILE.EMPTY_MENU_DESC}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {restaurantData.foods.map((food: any) => (
                  <FoodCard 
                    key={food.id} 
                    food={{ ...food, restaurant: restaurantData }} 
                    onViewDetail={setSelectedFood} 
                  />
                ))}
              </div>
            )}
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
            onItemClick={(followerUser) => {
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
            restaurants={followingList.map((item: any) => item.restaurant)}
            onRestaurantClick={(restaurantItem) => {
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
