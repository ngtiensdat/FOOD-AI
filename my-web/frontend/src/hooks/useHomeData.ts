import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';
import { LIMITS } from '@/constants/limits.constant';
import { DEFAULT_COORDINATES } from '@/constants/location.constant';

export const useHomeData = (city?: string, district?: string) => {
  const [realFoods, setRealFoods] = useState<any[]>([]);
  const [featuredToday, setFeaturedToday] = useState<any[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<any[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [nearbyFoods, setNearbyFoods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFoods, resToday, resWeekly, resRecommended] = await Promise.all([
          foodService.getAllFoods({ city, district }),
          foodService.getFeaturedToday(),
          foodService.getFeaturedWeekly(),
          foodService.getRecommendedFoods()
        ]);

        const filterByLocation = (list: any[]) => {
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
        };

        setRealFoods(resFoods);
        setFeaturedToday(filterByLocation(resToday));
        setFeaturedWeekly(filterByLocation(resWeekly));
        setRecommendedFoods(filterByLocation(resRecommended));

        const fetchNearbyWithFallback = async (lat: number, lng: number) => {
          try {
            const nearby = await foodService.getNearbyFoods(lat, lng, LIMITS.NEARBY_FOODS_RADIUS);
            setNearbyFoods(nearby);
          } catch (err) {
            console.error('Lỗi lấy món ăn quanh đây:', err);
          }
        };

        if (typeof window !== 'undefined' && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await fetchNearbyWithFallback(latitude, longitude);
            },
            async (error) => {
              console.warn('Lỗi định vị GPS, dùng vị trí mặc định:', error.message);
              const defaultLat = city === 'Hồ Chí Minh'
                ? DEFAULT_COORDINATES.HCM.lat
                : DEFAULT_COORDINATES.HANOI.lat;
              const defaultLng = city === 'Hồ Chí Minh'
                ? DEFAULT_COORDINATES.HCM.lng
                : DEFAULT_COORDINATES.HANOI.lng;
              await fetchNearbyWithFallback(defaultLat, defaultLng);
            },
            {
              timeout: LIMITS.GEOLOCATION_TIMEOUT,
              maximumAge: LIMITS.GEOLOCATION_MAX_AGE,
              enableHighAccuracy: true
            }
          );
        } else {
          const defaultLat = city === 'Hồ Chí Minh'
            ? DEFAULT_COORDINATES.HCM.lat
            : DEFAULT_COORDINATES.HANOI.lat;
          const defaultLng = city === 'Hồ Chí Minh'
            ? DEFAULT_COORDINATES.HCM.lng
            : DEFAULT_COORDINATES.HANOI.lng;
          await fetchNearbyWithFallback(defaultLat, defaultLng);
        }
      } catch (err) {
        console.error('Lỗi kết nối API:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [city, district]);

  return {
    realFoods,
    featuredToday,
    featuredWeekly,
    recommendedFoods,
    nearbyFoods,
    isLoading
  };
};
