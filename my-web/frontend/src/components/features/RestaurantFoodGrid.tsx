'use client';

import React from 'react';
import { Utensils } from 'lucide-react';
import { FoodCard } from '@/components/features/FoodCard';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface RestaurantFoodGridProps {
  foodsData: any[];
  loadingFoods: boolean;
  hasMoreFoods: boolean;
  restaurantData: any;
  handleLoadMoreFoods: () => void;
  setSelectedFood: (food: any) => void;
}

export const RestaurantFoodGrid = ({
  foodsData,
  loadingFoods,
  hasMoreFoods,
  restaurantData,
  handleLoadMoreFoods,
  setSelectedFood,
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

  return (
    <div className="flex-1 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {foodsData.map((food: any) => (
          <FoodCard 
            key={food.id} 
            food={{ ...food, restaurant: restaurantData }} 
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
};
