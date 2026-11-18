/**
 * @fileoverview frontend/src/app/explore/page.tsx
 * @module ExplorePage
 * @description Trang Khám phá (Explore) hiển thị danh sách món ăn và quán ăn theo Tag, khu vực (City/District) và từ khóa tìm kiếm. Hỗ trợ tab xem Món ăn / Quán ăn / Tất cả và xem chi tiết món ăn trong modal.
 **/
'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, ShoppingBag, MapPin, Utensils, Store, LayoutGrid, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Services & Components
import { RestaurantCard } from '@/components/features/restaurant/RestaurantCard';
import { FoodCard } from '@/components/features/food/FoodCard';
import { ExploreFoodCard } from '@/components/features/food/ExploreFoodCard';
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
    curatedFilter,
    setCuratedFilter,
    isVegetarianUser,
    isSpicyUser,
    userPrefs,
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

      {/* Header & Filter Area */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800/80 pt-20 md:pt-24 pb-6 px-4 md:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top Row: Back button, Title, Result Count, and Segmented Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="w-9 h-9 rounded-xl shrink-0 border-gray-200 dark:border-slate-700"
                aria-label="Quay lại"
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {tag ? LABELS.EXPLORE.TITLE_TAG(tag) : searchQuery ? `Tìm kiếm "${searchQuery}"` : LABELS.EXPLORE.TITLE_TAG('')}
                </h1>
                <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">
                  {LABELS.EXPLORE.FOUND_COUNT_BOTH(foods.length, restaurants.length)}
                </p>
              </div>
            </div>

            {/* View Filter Tabs: Tất cả, Món ăn, Quán ăn (Segmented Style) */}
            <div className="flex items-center gap-1 p-1 bg-gray-100/90 dark:bg-slate-800/90 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {viewTabs.map(({ id, label, icon: Icon, count }) => {
                const isSelected = selectedView === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedView(id)}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-primary shadow-2xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-primary' : 'text-gray-400 dark:text-slate-500'} />
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        isSelected
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-primary'
                          : 'bg-gray-200/60 dark:bg-slate-700/60 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Location & Search Capsule Bar */}
          <div className="bg-gray-50/90 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 flex flex-col md:flex-row items-center gap-2 shadow-2xs">
            {/* City Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl w-full md:w-48 border border-gray-200/50 dark:border-slate-700/40 shrink-0">
              <MapPin size={16} className="text-primary shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold w-full cursor-pointer text-gray-800 dark:text-slate-100"
              >
                {LOCATION_DATA.map((city) => (
                  <option key={city.value} value={city.value} className="text-gray-900 bg-white dark:bg-slate-800 dark:text-white">
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl w-full md:w-56 border border-gray-200/50 dark:border-slate-700/40 shrink-0">
              <Compass size={16} className="text-primary shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold w-full cursor-pointer text-gray-800 dark:text-slate-100"
              >
                <option key="all-districts" value="" className="text-gray-900 bg-white dark:bg-slate-800 dark:text-white">
                  {LABELS.EXPLORE.ALL_DISTRICTS}
                </option>
                {LOCATION_DATA.find((c) => c.value === selectedCity)
                  ?.districts.map((d) => (
                    <option key={d.value} value={d.value} className="text-gray-900 bg-white dark:bg-slate-800 dark:text-white">
                      {d.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder={tag ? LABELS.EXPLORE.SEARCH_IN_TAG(tag) : LABELS.EXPLORE.SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/40 text-xs font-medium text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
            {[...Array(8)].map((_, i) => {
              const heights = ['h-64', 'h-52', 'h-72', 'h-56'];
              return (
                <div
                  key={i}
                  className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-2xs animate-pulse flex flex-col break-inside-avoid mb-6 ${heights[i % 4]}`}
                >
                  <div className="w-full flex-1 bg-gray-200/80 dark:bg-slate-800/80" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-1/2" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <ShoppingBag size={56} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1.5">{LABELS.EXPLORE.EMPTY_TITLE}</h3>
            <p className="text-gray-400 dark:text-slate-400 text-xs max-w-md mx-auto">{LABELS.EXPLORE.EMPTY_DESC}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Mục MÓN ĂN: hiển thị khi chọn tab 'all' hoặc 'foods' */}
            {(selectedView === 'all' || selectedView === 'foods') && (
              <section className="space-y-5">
                {/* Header Mục Món Ăn kèm Bộ Lọc Cá Nhân Hóa (Ăn chay, Đồ cay, Gu của bạn) */}
                <div className="space-y-3 border-b border-gray-100 dark:border-slate-800/80 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-primary">
                        <Utensils size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                            Món ngon tinh chọn
                          </h2>
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-orange-500/10 text-primary">
                            {foods.length} món chất lượng
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                          Chỉ hiển thị các món có hình ảnh thực tế, chuẩn chất lượng & khẩu vị
                        </p>
                      </div>
                    </div>

                    {selectedView === 'all' && foods.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setSelectedView('foods')}
                        className="text-xs font-bold text-primary hover:text-orange-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Xem tất cả {foods.length} món</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>

                  {/* Thanh Pills Lọc Sở Thích Cá Nhân Hóa (Ăn chay, Ăn cay, Gu ẩm thực) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                    <button
                      type="button"
                      onClick={() => setCuratedFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        curatedFilter === 'all'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🍽️</span>
                      <span>Tất cả</span>
                    </button>

                    {(isVegetarianUser || isSpicyUser || userPrefs?.cuisine) && (
                      <button
                        type="button"
                        onClick={() => setCuratedFilter('for_you')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          curatedFilter === 'for_you'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                            : 'bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/60 dark:border-orange-800/40 hover:bg-orange-100'
                        }`}
                      >
                        <span>✨</span>
                        <span>Khớp gu của bạn</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-extrabold">
                          {isVegetarianUser ? 'Ăn chay 🥗' : isSpicyUser ? 'Đồ cay 🌶️' : 'Theo sở thích'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCuratedFilter('vegetarian')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        curatedFilter === 'vegetarian'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🥗</span>
                      <span>Món chay thanh tịnh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCuratedFilter('spicy')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        curatedFilter === 'spicy'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🌶️</span>
                      <span>Đậm đà vị cay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCuratedFilter('featured')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        curatedFilter === 'featured'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>⭐</span>
                      <span>Nổi bật & Đề xuất</span>
                    </button>
                  </div>
                </div>

                {foods.length === 0 ? (
                  <EmptySectionMessage message="Không tìm thấy món ăn nào có hình ảnh và phù hợp với tiêu chí lọc hiện tại." />
                ) : (
                  /* Bố cục Masonry không đối xứng: Ảnh Chữ nhật đứng, Vuông, Chữ nhật ngang xen kẽ */
                  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
                    <AnimatePresence>
                      {foods.map((food, index) => (
                        <motion.div
                          key={food.id || index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.25) }}
                          className="break-inside-avoid mb-6"
                        >
                          <ExploreFoodCard
                            food={food}
                            index={index}
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
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Store size={15} />
                      </div>
                      <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        Quán ăn & Nhà hàng
                      </h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {restaurants.length} quán
                      </span>
                    </div>

                    {restaurants.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setSelectedView('restaurants')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem tất cả {restaurants.length} quán</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                )}

                {restaurants.length === 0 ? (
                  <EmptySectionMessage message="Không tìm thấy quán ăn nào phù hợp với bộ lọc hiện tại." />
                ) : (
                  <div className="grid items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                    <AnimatePresence>
                      {restaurants.map((restaurant, index) => (
                        <motion.div
                          key={restaurant.id || `restaurant-${index}`}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.25) }}
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
              <div className="flex justify-center mt-10 border-t border-gray-100 dark:border-slate-800/50 pt-8">
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
