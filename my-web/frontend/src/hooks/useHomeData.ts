import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';

export const useHomeData = () => {
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
          foodService.getAllFoods(),
          foodService.getFeaturedToday(),
          foodService.getFeaturedWeekly(),
          foodService.getRecommendedFoods()
        ]);
        setRealFoods(resFoods);
        setFeaturedToday(resToday);
        setFeaturedWeekly(resWeekly);
        setRecommendedFoods(resRecommended);

        if (typeof window !== 'undefined' && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const nearby = await foodService.getNearbyFoods(latitude, longitude);
                setNearbyFoods(nearby);
              } catch (err) {
                console.error('Lỗi lấy món gần đây:', err);
              }
            }
          );
        }
      } catch (err) {
        console.error('Lỗi kết nối API:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return {
    realFoods,
    featuredToday,
    featuredWeekly,
    recommendedFoods,
    nearbyFoods,
    isLoading
  };
};
