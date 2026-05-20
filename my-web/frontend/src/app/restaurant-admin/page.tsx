'use client';

import React from 'react';
import { 
  Store, BarChart3, ArrowLeft, Pizza, Sparkles, Plus, Menu, HelpCircle
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantActions } from '@/hooks/useRestaurantActions';
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { UserDropdown } from '@/components/features/UserDropdown';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { LIMITS } from '@/constants/limits.constant';
import Image from 'next/image';

// Feature Components
import { MenuTable } from '@/components/features/MenuTable';
import { FoodFormModal } from '@/components/features/FoodFormModal';
import { ConfirmModal } from '@/components/base/ConfirmModal';

export default function RestaurantDashboard() {
  const { user, logout } = useAuth();
  
  const {
    myFoods,
    loading,
    activeTab,
    setActiveTab,
    isAddingFood,
    setIsAddingFood,
    editingFood,
    formData,
    setFormData,
    showMenu,
    setShowMenu,
    restaurant,
    isRestaurantActive,
    deleteConfirmId,
    setDeleteConfirmId,
    actions
  } = useRestaurantActions(user);

  return (
    <div className="admin-layout">
      <Sidebar brandIcon={Store} brandLabel={LABELS.RESTAURANT.MERCHANT_HUB}>
        <SidebarItem icon={BarChart3} label={LABELS.RESTAURANT.TABS.OVERVIEW} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <SidebarItem icon={Pizza} label={LABELS.RESTAURANT.TABS.MENU} active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
        <SidebarItem icon={Sparkles} label={LABELS.RESTAURANT.TABS.HISTORY} active={activeTab === 'ai-history'} onClick={() => setActiveTab('ai-history')} />
        <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
      </Sidebar>

      <main className="admin-main">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h2 className="text-h1 !text-4xl text-gray-900 dark:text-white">
              {activeTab === 'overview' ? LABELS.RESTAURANT.DASHBOARD_TITLE : 
               activeTab === 'menu' ? LABELS.RESTAURANT.MENU_MANAGEMENT : 
               LABELS.RESTAURANT.AI_HISTORY}
            </h2>
            <p className="text-body text-gray-500 dark:text-slate-400 mt-1">{LABELS.RESTAURANT.SUBTITLE}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle Status Switch with premium light/dark animations */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isRestaurantActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isRestaurantActive ? LABELS.RESTAURANT.STATUS_OPEN : LABELS.RESTAURANT.STATUS_CLOSED}
              </span>
              <button
                onClick={actions.toggleRestaurantStatus}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                  isRestaurantActive ? 'bg-primary dark:bg-orange-600' : 'bg-gray-200 dark:bg-slate-850'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isRestaurantActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>

              {/* Tooltip Help Icon */}
              <div className="relative group flex items-center justify-center cursor-help">
                <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 transition-colors" />
                <div className="absolute right-0 bottom-full mb-3 w-64 p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-xl shadow-xl opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 text-[11px] text-gray-500 dark:text-slate-305 font-normal leading-relaxed">
                  {LABELS.RESTAURANT.STATUS_TOOLTIP}
                  <div className="absolute top-full right-3 -translate-y-px w-2 h-2 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-gray-150 dark:border-slate-700" />
                </div>
              </div>
            </div>

            {activeTab === 'menu' && (
              <Button onClick={actions.handleOpenAdd}>
                <Plus size={24} className="mr-2" /> {LABELS.RESTAURANT.ADD_FOOD}
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-3 relative ml-2">
                <Button 
                  variant="outline" 
                  className="w-10 h-10 p-0 rounded-xl" 
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Menu size={24} />
                </Button>

                {showMenu && (
                  <UserDropdown 
                    user={user} 
                    onLogout={logout} 
                    onSettingsClick={() => window.location.href = '/'} 
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card-container p-8">
              <h3 className="text-h2 text-gray-800 dark:text-slate-100 mb-8">{LABELS.RESTAURANT.RECENT_ACTIVITY}</h3>
              <div className="space-y-6">
                {myFoods.slice(0, LIMITS.RECENT_VIEWS_DASHBOARD).map((food, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-800">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                      <Image 
                        src={getValidImageUrl(food.image)} 
                        className="object-cover" 
                        alt={food.name || LABELS.COMMON.UNKNOWN}
                        fill
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 dark:text-slate-200 text-body">{food.name}</h4>
                      <p className="text-small text-gray-400">{LABELS.RESTAURANT.STATUS}: <span className="text-primary font-bold">{food.status}</span></p>
                    </div>
                    <p className="font-bold text-gray-800 dark:text-slate-200 text-body">{formatCurrency(food.price)}</p>
                  </div>
                ))}
                {myFoods.length === 0 && <p className="text-center text-gray-400 py-8">{LABELS.RESTAURANT.NO_FOOD}</p>}
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <h3 className="text-h3 text-gray-800 dark:text-slate-100 mb-6">{LABELS.RESTAURANT.SETTINGS_TITLE}</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-2">{LABELS.RESTAURANT.OPERATING_HOURS}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: 08:00 - 22:00"
                        defaultValue={restaurant?.profile?.openingHours || ''}
                        id="opening-hours-input"
                        className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary dark:text-slate-200"
                      />
                      <Button
                        onClick={() => {
                          const val = (document.getElementById('opening-hours-input') as HTMLInputElement)?.value;
                          actions.updateProfileHours(val);
                        }}
                      >
                        {LABELS.RESTAURANT.SAVE}
                      </Button>
                    </div>
                  </div>
                  {restaurant?.profile?.contactPhone && (
                    <div>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1">{LABELS.RESTAURANT.CONTACT_PHONE}</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{restaurant.profile.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="gradient-bg rounded-card p-8 text-white shadow-xl shadow-orange-100 dark:shadow-none">
                <Sparkles size={40} className="mb-6 opacity-50" />
                <h3 className="text-h2 !text-white mb-4">{LABELS.RESTAURANT.AI_SUGGESTION_TITLE}</h3>
                <p className="text-body text-orange-50 mb-8 leading-relaxed">{LABELS.RESTAURANT.AI_SUGGESTION_DESC}</p>
                <Button variant="secondary" fullWidth>{LABELS.RESTAURANT.VIEW_INSIGHT}</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <MenuTable 
            myFoods={myFoods} 
            loading={loading} 
            actions={actions}
          />
        )}
      </main>

      <AnimatePresence>
        {isAddingFood && (
          <FoodFormModal 
            key="food-form-modal"
            isOpen={isAddingFood} 
            onClose={() => setIsAddingFood(false)} 
            editingFood={editingFood} 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={actions.handleSubmit} 
          />
        )}
        {deleteConfirmId !== null && (
          <ConfirmModal
            key="delete-confirm-modal"
            isOpen={deleteConfirmId !== null}
            title="Xác nhận xóa món ăn"
            message={LABELS.RESTAURANT.DELETE_FOOD_CONFIRM}
            onConfirm={actions.onConfirmDelete}
            onCancel={() => setDeleteConfirmId(null)}
            confirmText={LABELS.COMMON.DELETE}
            cancelText={LABELS.COMMON.CANCEL}
            variant="danger"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
