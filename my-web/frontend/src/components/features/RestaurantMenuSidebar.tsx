'use client';

import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface RestaurantMenuSidebarProps {
  categories: any[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  expandedCategories: Record<number, boolean>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}

export const RestaurantMenuSidebar = ({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  expandedCategories,
  setExpandedCategories,
}: RestaurantMenuSidebarProps) => {
  const toggleCategory = (id: number) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCategoryTree = (cats: any[], level = 0) => {
    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-4 border-l border-gray-100 dark:border-slate-800 pl-2 mt-1' : ''}`}>
        {cats.map(cat => {
          const hasChildren = cat.children && cat.children.length > 0;
          const isSelected = selectedCategoryId === cat.id;
          const isExpanded = expandedCategories[cat.id];
          return (
            <div key={cat.id}>
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20 text-primary font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  if (hasChildren && !isExpanded) toggleCategory(cat.id);
                }}
              >
                <span className="text-sm">{cat.name}</span>
                {hasChildren && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
              </div>
              {hasChildren && isExpanded && renderCategoryTree(cat.children, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 lg:sticky lg:top-24">
        <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-lg">
          {LABELS.RESTAURANT.PUBLIC_PROFILE.MENU_CATEGORIES}
        </h3>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedCategoryId === null ? 'bg-orange-50 dark:bg-orange-900/20 text-primary font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            {LABELS.RESTAURANT.PUBLIC_PROFILE.ALL_FOODS}
          </div>
          {categories.map(group => (
            <div key={`g-${group.id}`} className="pt-3 border-t border-gray-50 dark:border-slate-800 mt-2">
              <div className="font-bold text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">{group.name}</div>
              {group.categories && renderCategoryTree(group.categories)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
