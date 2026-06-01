/**
 * Mục đích file này: Hook quản lý trạng thái tải và tìm kiếm danh sách các nhà hàng công khai trên trang Khám Phá (/explore).
 * Các file liên quan: Được gọi bởi ExplorePage component.
 * Chức năng đặc biệt: Tự động tải dữ liệu nhà hàng công khai dựa trên tag danh mục, thành phố, quận/huyện và từ khóa tìm kiếm (đã được debounce).
 */
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { restaurantService } from '@/services/food.service';
import { LOCATION_DATA } from '@/constants/location.constant';
import { Restaurant } from '@/types/restaurant';

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
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('explore');
  const [selectedCity, setSelectedCity] = useState(LOCATION_DATA[0]?.value || 'Hà Nội');
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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tag, selectedCity, selectedDistrict, searchQuery]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const res = await restaurantService.getPublicRestaurants({
          tag: tag || undefined,
          city: selectedCity,
          district: selectedDistrict || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          pageSize: 6,
        });
        
        // Nhận diện kiểu dữ liệu an toàn để tương thích với cấu trúc của backend
        const response = res as unknown as ExploreResponse | Restaurant[];

        if (response && !Array.isArray(response) && Array.isArray(response.restaurants)) {
          setRestaurants(response.restaurants);
          setTotalPages(Math.ceil((response.total || 0) / 6));
        } else if (Array.isArray(response)) {
          setRestaurants(response);
          setTotalPages(1);
        } else if (response && !Array.isArray(response) && Array.isArray(response.data)) {
          setRestaurants(response.data);
          setTotalPages(Math.ceil((response.total || 0) / 6));
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

    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 300);

    return () => clearTimeout(timer);
  }, [tag, selectedCity, selectedDistrict, searchQuery, currentPage]);

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
