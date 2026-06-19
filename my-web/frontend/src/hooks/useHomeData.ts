import { useState, useEffect, useCallback } from 'react';
import { foodService } from '@/services/food.service';
import { restaurantService } from '@/services/restaurant.service';
import { LIMITS } from '@/constants/limits.constant';
import { DEFAULT_COORDINATES, CITY_COORDINATES } from '@/constants/location.constant';
import { Food } from '@/types/food';
import { Restaurant } from '@/types/restaurant';

export type FoodTab = 'recommended' | 'today' | 'weekly';

export const useHomeData = (city?: string, district?: string) => {
  const [featuredToday, setFeaturedToday] = useState<Food[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<Food[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<Food[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFoodTab, setActiveFoodTab] = useState<FoodTab>('recommended');
  const [hasLoaded, setHasLoaded] = useState<Record<FoodTab, boolean>>({
    recommended: false,
    today: false,
    weekly: false,
  });

  const filterByLocation = useCallback((list: Food[]) => {
    let filtered = [...list];
    if (city) {
      const cLower = city.toLowerCase();
      filtered = filtered.filter(f => 
        (f.address && f.address.toLowerCase().includes(cLower)) ||
        (f.restaurant?.address && f.restaurant.address.toLowerCase().includes(cLower))
      );
    }
    if (district) {
      const dLower = district.toLowerCase();
      filtered = filtered.filter(f => 
        (f.address && f.address.toLowerCase().includes(dLower)) ||
        (f.restaurant?.address && f.restaurant.address.toLowerCase().includes(dLower))
      );
    }
    return filtered;
  }, [city, district]);

  // Reset cache when location changes
  useEffect(() => {
    setHasLoaded({
      recommended: false,
      today: false,
      weekly: false,
    });
    setRecommendedFoods([]);
    setFeaturedToday([]);
    setFeaturedWeekly([]);
  }, [city, district]);

  const isCurrentTabLoaded = hasLoaded[activeFoodTab];

  // Fetch data for the active food tab
  useEffect(() => {
    if (isCurrentTabLoaded) return;

    let isMounted = true;

    const fetchFoodTab = async () => {
      try {
        setIsLoading(true);
        if (activeFoodTab === 'recommended') {
          const res = await foodService.getRecommendedFoods();
          if (isMounted) {
            setRecommendedFoods(filterByLocation(res));
            setHasLoaded(prev => ({ ...prev, recommended: true }));
          }
        } else if (activeFoodTab === 'today') {
          const res = await foodService.getFeaturedToday();
          if (isMounted) {
            setFeaturedToday(filterByLocation(res));
            setHasLoaded(prev => ({ ...prev, today: true }));
          }
        } else if (activeFoodTab === 'weekly') {
          const res = await foodService.getFeaturedWeekly();
          if (isMounted) {
            setFeaturedWeekly(filterByLocation(res));
            setHasLoaded(prev => ({ ...prev, weekly: true }));
          }
        }
      } catch (err) {
        console.error(`Lỗi tải dữ liệu cho tab ${activeFoodTab}:`, err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFoodTab();

    return () => {
      isMounted = false;
    };
  }, [activeFoodTab, city, district, isCurrentTabLoaded, filterByLocation]);

  // Fetch nearby restaurants (location dependent)
  useEffect(() => {
    let isMounted = true;

    const fetchNearby = async () => {
      const fallbackCoords = (city && CITY_COORDINATES[city]) || DEFAULT_COORDINATES.HANOI;

      const fetchNearbyWithFallback = async (lat: number, lng: number) => {
        try {
          const nearby = await restaurantService.getNearbyRestaurants(lat, lng, LIMITS.NEARBY_FOODS_RADIUS);
          if (isMounted) {
            setNearbyRestaurants(nearby);
          }
        } catch (err) {
          console.error('Lỗi lấy quán ăn quanh đây:', err);
        }
      };

      if (typeof window !== 'undefined' && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!isMounted) return;
            const { latitude, longitude } = position.coords;
            await fetchNearbyWithFallback(latitude, longitude);
          },
          async (error) => {
            if (!isMounted) return;
            console.warn('Lỗi định vị GPS, dùng vị trí mặc định:', error.message);
            await fetchNearbyWithFallback(fallbackCoords.lat, fallbackCoords.lng);
          },
          {
            timeout: LIMITS.GEOLOCATION_TIMEOUT,
            maximumAge: LIMITS.GEOLOCATION_MAX_AGE,
            enableHighAccuracy: true
          }
        );
      } else {
        await fetchNearbyWithFallback(fallbackCoords.lat, fallbackCoords.lng);
      }
    };

    fetchNearby();

    return () => {
      isMounted = false;
    };
  }, [city, district]);

  return {
    featuredToday,
    featuredWeekly,
    recommendedFoods,
    nearbyRestaurants,
    isLoading,
    activeFoodTab,
    setActiveFoodTab,
  };
};
