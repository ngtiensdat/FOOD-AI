/**
 * @fileoverview frontend/src/app/explore/page.tsx
 * @module ExplorePage
 * @description Trang Khám phá (Explore) hiển thị danh sách món ăn và quán ăn theo Tag, khu vực (City/District) và từ khóa tìm kiếm. Hỗ trợ tab xem Món ăn / Quán ăn / Tất cả và xem chi tiết món ăn trong modal.
 **/
'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, ShoppingBag, MapPin, Utensils, Store, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Services & Components
import { RestaurantCard } from '@/components/features/restaurant/RestaurantCard';
import { FoodCard, type FoodCardData } from '@/components/features/food/FoodCard';
import { FoodDetailModal, type FoodDetailData } from '@/components/features/food/FoodDetailModal';
import { Pagination } from '@/components/base/Pagination';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { useExploreActions } from '@/hooks/useExploreActions';
import { LABELS } from '@/constants/labels';
import { LOCATION_DATA } from '@/constants/location.constant';

const EmptySectionMessage = ({ message }: { message: string }) => (
  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 text-gray-400">
    {message}
  </div>
);

function ExploreContent() {
  const router = useRouter();
  const {
    tag,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    restaurants,
    foods,
    selectedFood,
    setSelectedFood,
    selectedView,
    setSelectedView,
    selectedCity,
    selectedDistrict,
    setSelectedCity,
    setSelectedDistrict,
    currentPage,
    setCurrentPage,
    totalPages,
    handleToggleFavorite,
  } = useExploreActions();

  const totalResults = foods.length + restaurants.length;

  const viewTabs = [
    { id: 'all' as const, label: LABELS.EXPLORE.TABS.ALL, icon: LayoutGrid, count: totalResults },
    { id: 'foods' as const, label: LABELS.EXPLORE.TABS.FOODS, icon: Utensils, count: foods.length },
    { id: 'restaurants' as const, label: LABELS.EXPLORE.TABS.RESTAURANTS, icon: Store, count: restaurants.length },
  ];

  return (
    <div className="page-container min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={(tab: string) => {
        if (tab === 'home') router.push('/');
        else setActiveTab(tab as 'home' | 'explore' | 'offers' | 'settings');
      }} />

      {/* Header Area */}
      <div className="bg-white dark:bg-gray-100 mixed:bg-gray-100 border-b border-gray-100 dark:border-gray-200 mixed:border-gray-200 pt-32 pb-8 px-6 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="w-12 h-12 rounded-button"
                aria-label="Quay lại"
              >
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1 className="text-h2 text-gray-900">
                  {tag ? LABELS.EXPLORE.TITLE_TAG(tag) : searchQuery ? `Tìm kiếm "${searchQuery}"` : LABELS.EXPLORE.TITLE_TAG('')}
                </h1>
                <p className="text-gray-500 font-medium text-small">
                  {LABELS.EXPLORE.FOUND_COUNT_BOTH(foods.length, restaurants.length)}
                </p>
              </div>
            </div>

            <div className="w-full xl:w-auto flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 rounded-input px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm w-full md:w-44">
                <MapPin size={18} className="text-primary shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent border-none outline-none text-small font-semibold w-full cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  {LOCATION_DATA.map((city) => (
                    <option key={city.value} value={city.value} className="text-slate-900 bg-white">
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 rounded-input px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm w-full md:w-52">
                <MapPin size={18} className="text-primary shrink-0" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent border-none outline-none text-small font-semibold w-full cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option value="" className="text-slate-900 bg-white">
                    {LABELS.EXPLORE.ALL_DISTRICTS}
                  </option>
                  {LOCATION_DATA.find((c) => c.value === selectedCity)
                    ?.districts.map((d) => (
                      <option key={d.value} value={d.value} className="text-slate-900 bg-white">
                        {d.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="w-full md:w-80">
                <Input
                  icon={Search}
                  placeholder={tag ? LABELS.EXPLORE.SEARCH_IN_TAG(tag) : LABELS.EXPLORE.SEARCH_PLACEHOLDER}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* View Filter Tabs: Tất cả, Món ăn, Quán ăn */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-200 overflow-x-auto no-scrollbar">
            {viewTabs.map(({ id, label, icon: Icon, count }) => {
              const isSelected = selectedView === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedView(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-card overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm animate-pulse flex flex-col h-[265px]">
                <div className="h-32 bg-gray-200 dark:bg-slate-800" />
                <div className="px-5 pb-5 pt-10 relative flex-1 flex flex-col justify-between">
                  <div className="absolute -top-10 left-5 w-16 h-16 rounded-2xl bg-gray-300 dark:bg-slate-700" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-1/2" />
                  </div>
                  <div className="border-t border-gray-200 dark:border-slate-800/40 py-2.5 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-full" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-gray-100 rounded-card border border-dashed border-gray-200 dark:border-gray-300 shadow-sm transition-colors duration-300">
            <ShoppingBag size={64} className="mx-auto text-gray-300 dark:text-gray-400 mb-6" />
            <h3 className="text-h2 text-gray-900 mb-2">{LABELS.EXPLORE.EMPTY_TITLE}</h3>
            <p className="text-gray-400 text-body">{LABELS.EXPLORE.EMPTY_DESC}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Mục MÓN ĂN: hiển thị khi chọn tab 'all' hoặc 'foods' */}
            {(selectedView === 'all' || selectedView === 'foods') && (
              <section className="space-y-4">
                {selectedView === 'all' && (
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <Utensils className="text-primary" size={20} />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Món ăn phù hợp
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-primary">
                      {foods.length} món
                    </span>
                  </div>
                )}

                {foods.length === 0 ? (
                  <EmptySectionMessage message="Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {foods.map((food, index) => (
                        <motion.div
                          key={food.id || index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        >
                          <FoodCard
                            food={food}
                            onViewDetail={(item) => setSelectedFood(item as unknown as FoodDetailData)}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {/* Mục QUÁN ĂN / NHÀ HÀNG: hiển thị khi chọn tab 'all' hoặc 'restaurants' */}
            {(selectedView === 'all' || selectedView === 'restaurants') && (
              <section className="space-y-4">
                {selectedView === 'all' && (
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <Store className="text-blue-500" size={20} />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Quán ăn & Nhà hàng
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {restaurants.length} quán
                    </span>
                  </div>
                )}

                {restaurants.length === 0 ? (
                  <EmptySectionMessage message="Không tìm thấy quán ăn nào phù hợp với bộ lọc hiện tại." />
                ) : (
                  <div className="grid items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {restaurants.map((restaurant, index) => (
                        <motion.div
                          key={restaurant.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        >
                          <RestaurantCard restaurant={restaurant} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {totalPages > 1 && (selectedView === 'restaurants' || selectedView === 'all') && (
              <div className="flex justify-center mt-12 border-t border-gray-100 dark:border-slate-800/50 pt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal chi tiết món ăn khi click vào FoodCard */}
      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center font-bold text-h2 gradient-text">{LABELS.EXPLORE.LOADING}</div>}>
      <ExploreContent />
    </Suspense>
  );
}
