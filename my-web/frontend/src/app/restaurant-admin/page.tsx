'use client';

import React from 'react';
import { 
  Store, BarChart3, ArrowLeft, Pizza, Sparkles, Plus, Menu
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantActions } from '@/hooks/useRestaurantActions';
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { UserDropdown } from '@/components/features/UserDropdown';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';

// Feature Components
import { MenuTable } from '@/components/features/MenuTable';
import { FoodFormModal } from '@/components/features/FoodFormModal';

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
            <h2 className="text-h1 !text-4xl text-gray-800">
              {activeTab === 'overview' ? LABELS.RESTAURANT.DASHBOARD_TITLE : 
               activeTab === 'menu' ? LABELS.RESTAURANT.MENU_MANAGEMENT : 
               LABELS.RESTAURANT.AI_HISTORY}
            </h2>
            <p className="text-body text-gray-500 mt-1">{LABELS.RESTAURANT.SUBTITLE}</p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'menu' && (
              <Button onClick={actions.handleOpenAdd}>
                <Plus size={24} className="mr-2" /> {LABELS.RESTAURANT.ADD_FOOD}
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-3 relative ml-4">
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
              <h3 className="text-h2 text-gray-800 mb-8">{LABELS.RESTAURANT.RECENT_ACTIVITY}</h3>
              <div className="space-y-6">
                {myFoods.slice(0, 3).map((food, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                    <img src={food.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-body">{food.name}</h4>
                      <p className="text-small text-gray-400">{LABELS.RESTAURANT.STATUS}: <span className="text-primary font-bold">{food.status}</span></p>
                    </div>
                    <p className="font-bold text-gray-800 text-body">{formatCurrency(food.price)}</p>
                  </div>
                ))}
                {myFoods.length === 0 && <p className="text-center text-gray-400 py-8">{LABELS.RESTAURANT.NO_FOOD}</p>}
              </div>
            </div>
            
            <div className="gradient-bg rounded-card p-8 text-white shadow-xl shadow-orange-100">
              <Sparkles size={40} className="mb-6 opacity-50" />
              <h3 className="text-h2 !text-white mb-4">{LABELS.RESTAURANT.AI_SUGGESTION_TITLE}</h3>
              <p className="text-body text-orange-50 mb-8 leading-relaxed">{LABELS.RESTAURANT.AI_SUGGESTION_DESC}</p>
              <Button variant="secondary" fullWidth>{LABELS.RESTAURANT.VIEW_INSIGHT}</Button>
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
            isOpen={isAddingFood} 
            onClose={() => setIsAddingFood(false)} 
            editingFood={editingFood} 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={actions.handleSubmit} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
