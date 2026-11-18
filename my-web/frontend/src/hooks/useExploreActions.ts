// Mục đích: Quản lý trạng thái và hành động trên trang Khám Phá bao gồm tìm kiếm, phân trang và bộ lọc địa lý cho món ăn và nhà hàng.
// Ý nghĩa: Tách biệt logic truy vấn thông tin món ăn và nhà hàng công khai khỏi view component để dễ bảo trì và tối ưu trải nghiệm.
// Chức năng đặc biệt: Tự động tải lại danh sách dựa trên debounced search, lọc theo thành phố/quận/huyện, tag danh mục, hỗ trợ tab chuyển đổi giữa Món ăn / Quán ăn / Tất cả.
// Design Pattern: Custom Hook pattern, Debounce pattern, UI-Logic separation.
// Biến, hàm đặc biệt: useExploreActions, handleCityChange, handleDistrictChange, debouncedSearchQuery, selectedView.
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { restaurantService } from '@/services/restaurant.service';
import { foodService } from '@/services/food.service';
import { LOCATION_DATA, DEFAULT_CITY } from '@/constants/location.constant';
import { Restaurant } from '@/types/restaurant';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { FoodDetailData } from '@/components/features/food/FoodDetailModal';
import { useDebounce } from '@/hooks/useDebounce';
import { LIMITS } from '@/constants/limits.constant';
import { useAuthStore } from '@/store/useAuthStore';

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

export interface PersonalizationInfo {
  title: string;
  badge: string;
  description: string;
  isPersonalized: boolean;
}

export const useExploreActions = () => {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const searchParam = searchParams.get('search') || '';

  const user = useAuthStore((state) => state.user);
  const userPrefs = useMemo(() => {
    return (user?.profile?.preferences as Record<string, string>) || {};
  }, [user]);

  const isVegetarianUser = useMemo(() => {
    const goal = userPrefs.goal || '';
    const cuisine = (userPrefs.cuisine || '').toLowerCase();
    return (
      goal === 'weight_loss' ||
      goal === 'eat_clean' ||
      cuisine.includes('chay') ||
      cuisine.includes('thanh đạm') ||
      cuisine.includes('salad')
    );
  }, [userPrefs]);

  const isSpicyUser = useMemo(() => {
    const cuisine = (userPrefs.cuisine || '').toLowerCase();
    return cuisine.includes('cay') || cuisine.includes('spicy') || cuisine.includes('sa tế');
  }, [userPrefs]);

  const isDietOrWeightLoss = useMemo(() => {
    const goal = userPrefs.goal || '';
    return goal === 'weight_loss' || goal === 'eat_clean';
  }, [userPrefs]);

  const isMuscleGain = useMemo(() => {
    return userPrefs.goal === 'muscle_gain';
  }, [userPrefs]);

  // Tự động sinh thông tin cá nhân hóa dựa trên hồ sơ thực tế của người dùng
  const personalizationInfo = useMemo<PersonalizationInfo>(() => {
    if (isVegetarianUser) {
      return {
        title: 'Món Chay & Thanh Đạm Dành Riêng Cho Bạn',
        badge: '🥗 Cá nhân hóa: Gu Ăn Chay',
        description: 'Tự động hiển thị các món chay, salad và thực đơn thanh tịnh từ cơ sở dữ liệu dựa trên hồ sơ của bạn.',
        isPersonalized: true,
      };
    }
    if (isSpicyUser) {
      return {
        title: 'Món Cay Nồng Đậm Vị Dành Riêng Cho Bạn',
        badge: '🌶️ Cá nhân hóa: Gu Đồ Cay',
        description: 'Tự động hiển thị các món cay nóng, đậm đà chuẩn vị từ cơ sở dữ liệu dựa trên sở thích của bạn.',
        isPersonalized: true,
      };
    }
    if (isMuscleGain) {
      return {
        title: 'Món Giàu Protein & Tăng Cơ Dành Riêng Cho Bạn',
        badge: '💪 Cá nhân hóa: Mục tiêu Tăng cơ',
        description: 'Tự động lọc các món giàu đạm (bò, gà, trứng, hải sản) hỗ trợ tối ưu mục tiêu dinh dưỡng của bạn.',
        isPersonalized: true,
      };
    }
    if (userPrefs.cuisine) {
      const cLower = userPrefs.cuisine.toLowerCase();
      const displayCuisine =
        cLower === 'western'
          ? 'Âu - Mỹ (Western)'
          : cLower === 'korean'
            ? 'Hàn Quốc'
            : cLower === 'japanese'
              ? 'Nhật Bản'
              : cLower === 'vietnamese'
                ? 'Món Việt'
                : userPrefs.cuisine;

      return {
        title: `Món Ngon Dành Riêng Cho Bạn (${displayCuisine})`,
        badge: `✨ Cá nhân hóa: Gu ${displayCuisine}`,
        description: `Tự động hiển thị các món ăn khớp với gu ẩm thực "${displayCuisine}" của bạn.`,
        isPersonalized: true,
      };
    }
    return {
      title: 'Món Ngon Tinh Chọn',
      badge: '⭐ Tuyển chọn chất lượng cao',
      description: 'Chỉ hiển thị các món có hình ảnh thực tế, chuẩn chất lượng & hương vị được cộng đồng yêu thích.',
      isPersonalized: false,
    };
  }, [isVegetarianUser, isSpicyUser, isMuscleGain, userPrefs]);

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
        // Tự động truyền các tham số cá nhân hóa theo đúng hồ sơ người dùng
        let dietParam: string | undefined = undefined;
        let spiceParam: string | undefined = undefined;
        let cuisineParam: string | undefined = undefined;
        let allergiesParam: string | undefined = undefined;

        if (isVegetarianUser) {
          dietParam = 'chay';
        } else if (isSpicyUser) {
          spiceParam = 'cay';
        } else if (userPrefs.cuisine) {
          cuisineParam = userPrefs.cuisine;
        } else if (isMuscleGain) {
          cuisineParam = 'bò, gà, trứng';
        }

        if (userPrefs.allergies) {
          allergiesParam = userPrefs.allergies;
        }

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
            limit: 24, // 24 món tinh chọn chất lượng cao
            hasImage: true, // BẮT BUỘC CHỈ LẤY MÓN CÓ HÌNH ẢNH THẬT
            curated: true,  // LỌC BỎ TOPPING, RAU SỐNG, PHỤ GIA & SẮP XẾP MÓN NGON
            diet: dietParam,
            spice: spiceParam,
            cuisine: cuisineParam,
            allergies: allergiesParam,
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
          const rawFoods = parseFoodsPayload(foodsRes.value);
          // Bộ lọc chất lượng nghiêm ngặt: Phải có ảnh hợp lệ và loại bỏ các món phụ/topping
          const qualityFoods = rawFoods.filter((f) => {
            const hasValidImage = Boolean(f.image && f.image.trim() !== '' && !f.image.includes('placeholder'));
            if (!hasValidImage) return false;
            const nameLower = (f.name || '').toLowerCase();
            const isTopping =
              nameLower.includes('topping') ||
              nameLower.includes('rau sống') ||
              nameLower.includes('thêm') ||
              nameLower.includes('gia vị') ||
              nameLower.includes('nước chấm');
            return !isTopping;
          });

          setFoods(qualityFoods);
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
  }, [tag, selectedCity, selectedDistrict, debouncedSearchQuery, currentPage, isVegetarianUser, isSpicyUser, userPrefs]);

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
    personalizationInfo,
    userPrefs,
  };
};
