import { useState, useEffect } from 'react';
import { categoryService, CategoryGroup } from '@/services/category.service';

export const usePublicCategories = (restaurantId?: number | string | null) => {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const parsedId = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
    if (isNaN(parsedId)) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    categoryService.getPublicHierarchy(parsedId)
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  return { categories, loading };
};
