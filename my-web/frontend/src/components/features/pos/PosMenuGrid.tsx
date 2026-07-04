'use client';

import React from 'react';
import { ShoppingBag, Search, X, RefreshCw, Store, ArrowLeft } from 'lucide-react';
import { SafeImage } from '@/components/base/SafeImage';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { DiningTable } from '@/services/table.service';
import { Restaurant } from '@/types/restaurant';
import { User } from '@/types/user';
import { LABELS } from '@/constants/labels';
import Link from 'next/link';

interface CategoryGroup {
  id: number;
  name: string;
  categories?: { id: number; name: string }[];
}

interface FoodItem {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
  stock: number;
}

interface PosMenuGridProps {
  user: User | Partial<User>;
  tables: DiningTable[];
  selectedTableId: number | null;
  setSelectedTableId: (id: number | null) => void;
  branches: Restaurant[];
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  categoryGroups: CategoryGroup[];
  activeGroupId: number | null;
  setActiveGroupId: (id: number | null) => void;
  activeCategoryId: number | null;
  setActiveCategoryId: (id: number | null) => void;
  loadingMenu: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredMenu: FoodItem[];
  addToCart: (food: FoodItem) => void;
  onOpenTransferModal: () => void;
}

export const PosMenuGrid = ({
  user,
  tables,
  selectedTableId,
  setSelectedTableId,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  categoryGroups,
  activeGroupId,
  setActiveGroupId,
  activeCategoryId,
  setActiveCategoryId,
  loadingMenu,
  searchQuery,
  setSearchQuery,
  filteredMenu,
  addToCart,
  onOpenTransferModal,
}: PosMenuGridProps) => {
  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0">
      
      {/* Header & Branch Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Store size={22} className="text-primary" />
              {LABELS.POS.SCREEN_TITLE}
            </h1>
          </div>
          
          {/* Current active table info with Switch Table button */}
          <div className="flex items-center gap-3 mt-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3.5 py-1.5 rounded-2xl text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{LABELS.POS.CURRENT_TABLE(tables.find(t => t.id === selectedTableId)?.name || '')}</span>
            <button
              onClick={() => setSelectedTableId(null)}
              className="ml-2 font-black uppercase text-[10px] text-primary hover:text-orange-650 border-l border-emerald-200 dark:border-emerald-900/50 pl-3 cursor-pointer"
            >
              {LABELS.POS.SWITCH_TABLE_BTN}
            </button>
            <button
              onClick={onOpenTransferModal}
              className="ml-2 font-black uppercase text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 border-l border-emerald-200 dark:border-emerald-900/50 pl-3 cursor-pointer"
            >
              {LABELS.POS.TRANSFER_TABLE_BTN}
            </button>
          </div>
        </div>

        {/* Chi nhánh selection (Chỉ dành cho RESTAURANT/Merchant) */}
        {user.role === 'RESTAURANT' && branches.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-400">{LABELS.POS.BRANCH_LABEL}</span>
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 px-3 py-2 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {user.role === 'STAFF' && (
          <div className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase rounded-lg">
            {LABELS.POS.STAFF_ROLE}
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={LABELS.POS.SEARCH_PLACEHOLDER}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold focus:ring-1 focus:ring-primary focus:border-primary text-gray-750 dark:text-slate-200 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      {!loadingMenu && categoryGroups.length > 0 && (
        <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-4 rounded-3xl shadow-sm">
          {/* Group Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
            <button
              onClick={() => {
                setActiveGroupId(null);
                setActiveCategoryId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                activeGroupId === null
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {LABELS.POS.ALL_FOODS}
            </button>
            {categoryGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setActiveGroupId(group.id);
                  setActiveCategoryId(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                  activeGroupId === group.id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Subcategories (Pills) */}
          {activeGroupId !== null && (
            <div className="flex gap-2 overflow-x-auto pt-2 border-t border-gray-50 dark:border-slate-855 no-scrollbar select-none animate-in fade-in slide-in-from-top-1 duration-200">
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                  activeCategoryId === null
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                {LABELS.POS.ALL_IN_GROUP(categoryGroups.find(g => g.id === activeGroupId)?.name || '')}
              </button>
              {categoryGroups
                .find((g) => g.id === activeGroupId)
                ?.categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                      activeCategoryId === cat.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Items Grid */}
      {loadingMenu ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="animate-spin text-primary mb-3" size={32} />
          <span className="text-xs font-bold">{LABELS.POS.LOADING_MENU}</span>
        </div>
      ) : filteredMenu.length === 0 ? (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-850 rounded-3xl p-12 text-center text-gray-400">
          <ShoppingBag className="mx-auto mb-3 text-gray-300" size={40} />
          <span className="text-xs font-bold block">{LABELS.POS.NO_FOODS_FOUND}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-19rem)] pr-1 custom-scrollbar">
          {filteredMenu.map((food) => (
            <div
              key={food.id}
              onClick={() => addToCart(food)}
              className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01] ${
                food.stock <= 0 ? 'opacity-60 grayscale' : ''
              }`}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-50 dark:border-slate-850">
                <SafeImage src={getValidImageUrl(food.image)} alt={food.name} fill className="object-cover" />
                {food.stock <= 10 && food.stock > 0 && (
                  <span className="absolute top-2 left-2 bg-amber-500 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md shadow-sm">
                    {LABELS.POS.STOCK_LOW(food.stock)}
                  </span>
                )}
                {food.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xs uppercase">
                    {LABELS.POS.OUT_OF_STOCK}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                  {food.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-bold line-clamp-1">
                  {food.description || LABELS.POS.NO_DESCRIPTION}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-primary">
                  {formatCurrency(food.price)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold bg-gray-50 dark:bg-slate-950 px-1.5 py-0.5 rounded-md">
                  {LABELS.POS.STOCK_LABEL(food.stock)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
