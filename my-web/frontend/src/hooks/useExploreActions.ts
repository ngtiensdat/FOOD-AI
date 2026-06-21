// Mục đích: Quản lý trạng thái và hành động trên trang Khám Phá bao gồm tìm kiếm, phân trang và bộ lọc địa lý cho nhà hàng.
// Ý nghĩa: Tách biệt logic truy vấn thông tin nhà hàng công khai khỏi view component để dễ bảo trì và tối ưu trải nghiệm.
// Chức năng đặc biệt: Tự động tải lại danh sách dựa trên debounced search, lọc theo thành phố/quận/huyện và tag danh mục.
// Design Pattern: Custom Hook pattern, Debounce pattern, UI-Logic separation.
// Biến, hàm đặc biệt: useExploreActions, handleCityChange, handleDistrictChange, debouncedSearchQuery.
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { restaurantService } from '@/services/restaurant.service';
import { LOCATION_DATA, DEFAULT_CITY } from '@/constants/location.constant';
import { Restaurant } from '@/types/restaurant';
import { useDebounce } from '@/hooks/useDebounce';
import { LIMITS } from '@/constants/limits.constant';

interface ExploreResponse {
  restaurants?: Restaurant[];
  data?: Restaurant[];
  total?: number;
}

export const useExploreActions = () => {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Reset trang về 1 ngay khi bộ lọc thay đổi (không bị trễ)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [tag, selectedCity, selectedDistrict, debouncedSearchQuery]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const res = await restaurantService.getPublicRestaurants({
          tag: tag || undefined,
          city: selectedCity,
          district: selectedDistrict || undefined,
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          pageSize: LIMITS.EXPLORE_RESTAURANTS_PAGE_SIZE,
        });
        
        const response = res as unknown as ExploreResponse | Restaurant[];

        if (response && !Array.isArray(response) && Array.isArray(response.restaurants)) {
          setRestaurants(response.restaurants);
          setTotalPages(Math.ceil((response.total || 0) / LIMITS.EXPLORE_RESTAURANTS_PAGE_SIZE));
        } else if (Array.isArray(response)) {
          setRestaurants(response);
          setTotalPages(1);
        } else if (response && !Array.isArray(response) && Array.isArray(response.data)) {
          setRestaurants(response.data);
          setTotalPages(Math.ceil((response.total || 0) / LIMITS.EXPLORE_RESTAURANTS_PAGE_SIZE));
        } else {
          setRestaurants([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu nhà hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [tag, selectedCity, selectedDistrict, debouncedSearchQuery, currentPage]);

  return {
    tag,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    restaurants,
    selectedCity,
    selectedDistrict,
    setSelectedCity: handleCityChange,
    setSelectedDistrict: handleDistrictChange,
    currentPage,
    setCurrentPage,
    totalPages,
  };
};
