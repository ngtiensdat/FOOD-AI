import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';
import { restaurantService } from '@/services/restaurant.service';
import { LIMITS } from '@/constants/limits.constant';
import { DEFAULT_COORDINATES, CITY_COORDINATES } from '@/constants/location.constant';



export const useHomeData = (city?: string, district?: string) => {
  const [realFoods, setRealFoods] = useState<any[]>([]);
  const [featuredToday, setFeaturedToday] = useState<any[]>([]);
  const [featuredWeekly, setFeaturedWeekly] = useState<any[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [resFoods, resToday, resWeekly, resRecommended] = await Promise.all([
          foodService.getAllFoods({ city, district }),
          foodService.getFeaturedToday(),
          foodService.getFeaturedWeekly(),
          foodService.getRecommendedFoods()
        ]);

        if (!isMounted) return;

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
            const nearby = await restaurantService.getNearbyRestaurants(lat, lng, LIMITS.NEARBY_FOODS_RADIUS);
            if (isMounted) {
              setNearbyRestaurants(nearby);
            }
          } catch (err) {
            console.error('Lỗi lấy quán ăn quanh đây:', err);
          }
        };


        const fallbackCoords = (city && CITY_COORDINATES[city]) || DEFAULT_COORDINATES.HANOI;

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

      } catch (err) {
        console.error('Lỗi kết nối API:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [city, district]);

  return {
    realFoods,
    featuredToday,
    featuredWeekly,
    recommendedFoods,
    nearbyRestaurants,
    isLoading
  };
};

