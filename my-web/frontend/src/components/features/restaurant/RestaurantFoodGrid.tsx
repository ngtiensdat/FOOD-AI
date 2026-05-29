import React from 'react';
import { Utensils } from 'lucide-react';
import { FoodCardData } from '@/components/features/food/FoodCard';
import { MiniFoodCard } from '@/components/features/food/MiniFoodCard';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { MenuGroup } from './RestaurantMenuSidebar';

interface RestaurantFoodGridProps {
  foodsData: FoodCardData[];
  loadingFoods: boolean;
  hasMoreFoods: boolean;
  restaurantData: { name: string; [key: string]: unknown } | null;
  handleLoadMoreFoods: () => void;
  setSelectedFood: (food: FoodCardData) => void;
  categories: MenuGroup[];
  selectedCategoryId: number | null;
}

interface FlatCategory {
  id: number;
  name: string;
}

// Helper to extract flat list of categories defined outside component to prevent re-creation on render
const getFlatCategories = (groups: MenuGroup[]): FlatCategory[] => {
  const list: FlatCategory[] = [];
  const traverse = (cat: any) => {
    list.push({ id: cat.id, name: cat.name });
    if (cat.children && cat.children.length > 0) {
      cat.children.forEach(traverse);
    }
  };
  groups.forEach(group => {
    if (group.categories) {
      group.categories.forEach(traverse);
    }
  });
  return list;
};

export const RestaurantFoodGrid = ({
  foodsData,
  loadingFoods,
  hasMoreFoods,
  restaurantData,
  handleLoadMoreFoods,
  setSelectedFood,
  categories,
  selectedCategoryId,
}: RestaurantFoodGridProps) => {
  if (loadingFoods && foodsData.length === 0) {
    return (
      <div className="flex-1 w-full text-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">{LABELS.RESTAURANT.PUBLIC_PROFILE.LOADING_FOODS}</p>
      </div>
    );
  }

  if (foodsData.length === 0) {
    return (
      <div className="flex-1 w-full text-center py-20 bg-white dark:bg-slate-900 rounded-card border border-dashed border-gray-200 dark:border-slate-800 shadow-sm">
        <Utensils size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
        <h3 className="text-h3 text-gray-900 dark:text-slate-100 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.EMPTY_MENU}</h3>
        <p className="text-gray-400 text-small">{LABELS.RESTAURANT.PUBLIC_PROFILE.EMPTY_MENU_DESC}</p>
      </div>
    );
  }

  const flatCategories = getFlatCategories(categories);

  // If a specific category is selected, we render flat grid since API only returns foods of this category
  if (selectedCategoryId !== null) {
    const selectedCatName = flatCategories.find(c => c.id === selectedCategoryId)?.name || LABELS.RESTAURANT.PUBLIC_PROFILE.MENU_TAB;
    return (
      <div className="flex-1 w-full space-y-6">
        <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            {selectedCatName}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {foodsData.map((food: FoodCardData) => (
            <MiniFoodCard 
              key={food.id} 
              food={{ ...food, restaurant: restaurantData || undefined }} 
              onViewDetail={setSelectedFood} 
            />
          ))}
        </div>
        {hasMoreFoods && (
          <div className="text-center mt-10">
            <Button onClick={handleLoadMoreFoods} disabled={loadingFoods} className="px-8 shadow-md">
              {loadingFoods ? LABELS.RESTAURANT.PUBLIC_PROFILE.LOADING_MORE : LABELS.RESTAURANT.PUBLIC_PROFILE.LOAD_MORE}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // If "All Foods" is selected, we group client-side
  const renderedSections: React.ReactNode[] = [];

  // Group foods by categories
  flatCategories.forEach(category => {
    const categoryFoods = foodsData.filter(food => food.categoryId === category.id);
    if (categoryFoods.length > 0) {
      renderedSections.push(
        <div 
          key={`sec-${category.id}`} 
          id={`category-sec-${category.id}`} 
          className="mb-10 scroll-mt-24 category-section"
          data-category-id={category.id}
        >
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              {category.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {categoryFoods.map((food: FoodCardData) => (
              <MiniFoodCard 
                key={food.id} 
                food={{ ...food, restaurant: restaurantData || undefined }} 
                onViewDetail={setSelectedFood} 
              />
            ))}
          </div>
        </div>
      );
    }
  });

  // Group foods that do not belong to any category, or category not found
  const uncategorizedFoods = foodsData.filter(food => 
    !food.categoryId || !flatCategories.some(c => c.id === food.categoryId)
  );

  if (uncategorizedFoods.length > 0) {
    renderedSections.push(
      <div 
        key="sec-uncategorized" 
        id="category-sec-uncategorized" 
        className="mb-10 scroll-mt-24 category-section"
        data-category-id="uncategorized"
      >
        <div className="border-b border-gray-100 dark:border-slate-800 pb-3 mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            {LABELS.FOOD.UNCATEGORIZED}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {uncategorizedFoods.map((food: FoodCardData) => (
            <MiniFoodCard 
              key={food.id} 
              food={{ ...food, restaurant: restaurantData || undefined }} 
              onViewDetail={setSelectedFood} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full">
      <div className="space-y-4">
        {renderedSections}
      </div>
      {hasMoreFoods && (
        <div className="text-center mt-10">
          <Button onClick={handleLoadMoreFoods} disabled={loadingFoods} className="px-8 shadow-md">
            {loadingFoods ? LABELS.RESTAURANT.PUBLIC_PROFILE.LOADING_MORE : LABELS.RESTAURANT.PUBLIC_PROFILE.LOAD_MORE}
          </Button>
        </div>
      )}
    </div>
  );
};
