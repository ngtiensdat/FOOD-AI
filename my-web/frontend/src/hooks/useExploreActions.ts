'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { foodService } from '@/services/food.service';
import { useAuth } from '@/hooks/useAuth';

export const useExploreActions = () => {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const { isAuthenticated } = useAuth();

  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('explore');
  const [selectedCity, setSelectedCity] = useState('Hà Nội');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('');
  };

  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      try {
        const data = await foodService.getAllFoods({
          tag,
          city: selectedCity,
          district: selectedDistrict || undefined,
        });
        setFoods(data);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu món ăn:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, [tag, selectedCity, selectedDistrict]);

  useEffect(() => {
    if (selectedFood?.id && isAuthenticated) {
      foodService.trackView(selectedFood.id);
    }
  }, [selectedFood?.id, isAuthenticated]);

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.restaurant?.name || food.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    tag,
    loading,
    searchQuery,
    setSearchQuery,
    selectedFood,
    setSelectedFood,
    activeTab,
    setActiveTab,
    filteredFoods,
    selectedCity,
    selectedDistrict,
    setSelectedCity: handleCityChange,
    setSelectedDistrict,
  };
};
