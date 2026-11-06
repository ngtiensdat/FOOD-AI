// Mục đích: Quản lý trạng thái và hành động trên trang Khám Phá bao gồm tìm kiếm, phân trang và bộ lọc địa lý cho món ăn và nhà hàng.
// Ý nghĩa: Tách biệt logic truy vấn thông tin món ăn và nhà hàng công khai khỏi view component để dễ bảo trì và tối ưu trải nghiệm.
// Chức năng đặc biệt: Tự động tải lại danh sách dựa trên debounced search, lọc theo thành phố/quận/huyện, tag danh mục, hỗ trợ tab chuyển đổi giữa Món ăn / Quán ăn / Tất cả.
// Design Pattern: Custom Hook pattern, Debounce pattern, UI-Logic separation.
// Biến, hàm đặc biệt: useExploreActions, handleCityChange, handleDistrictChange, debouncedSearchQuery, selectedView.
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { restaurantService } from '@/services/restaurant.service';
import { foodService } from '@/services/food.service';
import { LOCATION_DATA, DEFAULT_CITY } from '@/constants/location.constant';
import { Restaurant } from '@/types/restaurant';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { FoodDetailData } from '@/components/features/food/FoodDetailModal';
import { useDebounce } from '@/hooks/useDebounce';
import { LIMITS } from '@/constants/limits.constant';

export type ExploreViewType = 'all' | 'foods' | 'restaurants';

function parseRestaurantsPayload(raw: unknown): { restaurants: Restaurant[]; total: number } {
  if (!raw) return { restaurants: [], total: 0 };
  if (Array.isArray(raw)) return { restaurants: raw, total: raw.length };
  const obj = raw as { restaurants?: Restaurant[]; data?: Restaurant[]; total?: number };
  const list = obj.restaurants || obj.data || [];
  return {
    restaurants: Array.isArray(list) ? list : [],
    total: typeof obj.total === 'number' ? obj.total : list.length,
  };
}

function parseFoodsPayload(raw: unknown): FoodCardData[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const obj = raw as { data?: FoodCardData[] };
  return Array.isArray(obj.data) ? obj.data : [];
}

export const useExploreActions = () => {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const searchParam = searchParams.get('search') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<FoodCardData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodDetailData | null>(null);
  const [selectedView, setSelectedView] = useState<ExploreViewType>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('explore');
  const [selectedCity, setSelectedCity] = useState((LOCATION_DATA[0]?.value) ?? DEFAULT_CITY);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('');
    setCurrentPage(1);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Reset trang về 1 ngay khi bộ lọc thay đổi (không bị trễ)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [tag, selectedCity, selectedDistrict, debouncedSearchQuery]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [restaurantsRes, foodsRes] = await Promise.allSettled([
          restaurantService.getPublicRestaurants({
            tag: tag || undefined,
            city: selectedCity,
            district: selectedDistrict || undefined,
            search: debouncedSearchQuery || undefined,
            page: currentPage,
            pageSize: LIMITS.EXPLORE_RESTAURANTS_PAGE_SIZE,
          }),
          foodService.getAllFoods({
            tag: tag || undefined,
            city: selectedCity,
            district: selectedDistrict || undefined,
            search: debouncedSearchQuery || undefined,
            limit: 50,
          }),
        ]);

        if (isCancelled) return;

        if (restaurantsRes.status === 'fulfilled') {
          const { restaurants: rList, total } = parseRestaurantsPayload(restaurantsRes.value);
          setRestaurants(rList);
          setTotalPages(Math.max(1, Math.ceil(total / LIMITS.EXPLORE_RESTAURANTS_PAGE_SIZE)));
        } else {
          console.error('Lỗi lấy dữ liệu nhà hàng:', restaurantsRes.reason);
          setRestaurants([]);
          setTotalPages(1);
        }

        if (foodsRes.status === 'fulfilled') {
          setFoods(parseFoodsPayload(foodsRes.value));
        } else {
          console.error('Lỗi lấy dữ liệu món ăn:', foodsRes.reason);
          setFoods([]);
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu khám phá:', error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [tag, selectedCity, selectedDistrict, debouncedSearchQuery, currentPage]);

  const handleToggleFavorite = async (foodId: number) => {
    try {
      const res = await foodService.toggleFavorite(foodId);
      return res?.isFavorite ?? false;
    } catch (e) {
      console.error('Lỗi toggle favorite:', e);
      return false;
    }
  };

  return {
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
    setSelectedCity: handleCityChange,
    setSelectedDistrict: handleDistrictChange,
    currentPage,
    setCurrentPage,
    totalPages,
    handleToggleFavorite,
  };
};
