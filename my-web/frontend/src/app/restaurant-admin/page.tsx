/**
 * Mục đích file này để làm gì: Trang Quản trị viên của Nhà hàng (Restaurant Admin Dashboard). Đóng vai trò Orchestrator quản lý toàn bộ các tính năng như Tổng quan, Danh mục, Thực đơn, Lịch sử AI.
 * Các file khác hay file này có ý nghĩa như nào: Tách bạch hoàn toàn logic và giao diện. Toàn bộ logic được trừu tượng hóa vào `useRestaurantActions`. Các Component con (MenuTable, CategoryManager, UploadExcelModal) đảm nhận render chi tiết.
 * Các chức năng đặc biệt: Toggle trạng thái nhà hàng trực tiếp trên Header, Upload Excel hàng loạt, Quản lý đa cơ sở, Gợi ý AI Insight.
 * Các biến, hàm đặc biệt trong file: `useRestaurantActions` quản lý state toàn cục của Dashboard.
 */
'use client';

import React from 'react';
import {
  Store, BarChart3, ArrowLeft, Pizza, Sparkles, Plus, HelpCircle, FolderTree, ChevronDown, Check, X, Search, Home, Compass, MessageSquare, User, Shield, FileUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantActions } from '@/hooks/useRestaurantActions';
import { Sidebar, SidebarItem, useSidebarCollapse } from '@/components/base/Sidebar';
import { Navbar } from '@/components/features/Navbar';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { UserDropdown } from '@/components/features/UserDropdown';
import { ThemeToggle } from '@/components/base/ThemeToggle';
import { LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { LIMITS } from '@/constants/limits.constant';
import { SafeImage } from '@/components/base/SafeImage';
import Link from 'next/link';
import { Avatar } from '@/components/base/Avatar';
import { useRouter } from 'next/navigation';

// Feature Components
import { MenuTable } from '@/components/features/restaurant/MenuTable';
import { FoodFormModal } from '@/components/features/food/FoodFormModal';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { CategoryManager } from '@/components/features/restaurant/CategoryManager';
import { UploadExcelModal } from '@/components/features/restaurant/UploadExcelModal';
import { EditRestaurantModal } from '@/components/features/restaurant/EditRestaurantModal';
import { MerchantAnalytics } from '@/components/features/restaurant/MerchantAnalytics';
import { AiInsightsSection } from '@/components/features/restaurant/analytics/AiInsightsSection';
import { ViewsAnalyticsTab } from '@/components/features/restaurant/analytics/ViewsAnalyticsTab';
import { InteractionsAnalyticsTab } from '@/components/features/restaurant/analytics/InteractionsAnalyticsTab';
import { ConversionAnalyticsTab } from '@/components/features/restaurant/analytics/ConversionAnalyticsTab';
import { ActivityAnalyticsTab } from '@/components/features/restaurant/analytics/ActivityAnalyticsTab';

export default function RestaurantDashboard() {
  const { user, logout, isAdmin, isRestaurant, loading: authLoading } = useAuth();
  const router = useRouter();

  const [slideDirection, setSlideDirection] = React.useState<'left' | 'right'>('left');
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const prevPath = sessionStorage.getItem('prevPath') || '';
      sessionStorage.setItem('prevPath', '/restaurant-admin');
      if (prevPath) {
        const pathOrder = ['/dashboard', '/restaurant-admin', '/admin'];
        const prevIndex = pathOrder.indexOf(prevPath);
        const currentIndex = pathOrder.indexOf('/restaurant-admin');
        if (prevIndex !== -1 && currentIndex !== -1) {
          setSlideDirection(currentIndex > prevIndex ? 'left' : 'right');
        }
      }
    }
  }, []);

  // Bảo vệ route - Tự động redirect nếu chưa đăng nhập hoặc không phải RESTAURANT / ADMIN
  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isRestaurant && !isAdmin) {
        router.push('/');
      }
    }
  }, [user, authLoading, isAdmin, isRestaurant, router]);

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
    myBranches,
    restaurant,
    isRestaurantActive,
    deleteConfirmId,
    setDeleteConfirmId,
    fetchMyFoods,
    actions
  } = useRestaurantActions(user);

  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [openingHoursText, setOpeningHoursText] = React.useState('');

  React.useEffect(() => {
    if (restaurant?.profile?.openingHours) {
      setOpeningHoursText(restaurant.profile.openingHours);
    }
  }, [restaurant]);

  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const overviewSubItems = [
    { 
      label: LABELS.RESTAURANT.TABS.OVERVIEW, 
      active: activeTab === 'overview', 
      onClick: () => {
        setActiveTab('overview');
      }
    },
    { 
      label: LABELS.RESTAURANT.KPI_VIEWS, 
      active: activeTab === 'views', 
      onClick: () => {
        setActiveTab('views');
      }
    },
    { 
      label: LABELS.RESTAURANT.KPI_INTERACTIONS, 
      active: activeTab === 'interactions',
      onClick: () => {
        setActiveTab('interactions');
      }
    },
    { 
      label: LABELS.RESTAURANT.KPI_CONVERSION, 
      active: activeTab === 'conversion',
      onClick: () => {
        setActiveTab('conversion');
      }
    },
    { 
      label: LABELS.RESTAURANT.KPI_RECENT_ACTIVITY, 
      active: activeTab === 'activity',
      onClick: () => {
        setActiveTab('activity');
      }
    }
  ];

  const menuSubItems = [
    { 
      label: LABELS.RESTAURANT.MENU_LIST, 
      active: activeTab === 'menu', 
      onClick: () => setActiveTab('menu')
    },
    { 
      label: LABELS.RESTAURANT.MENU_CATEGORIES, 
      active: activeTab === 'categories', 
      onClick: () => setActiveTab('categories')
    },
    { 
      label: LABELS.RESTAURANT.ADD_FOOD, 
      onClick: actions.handleOpenAdd
    },
    { 
      label: LABELS.RESTAURANT.IMPORT_EXCEL_MENU, 
      onClick: () => setIsUploadModalOpen(true)
    }
  ];

  const aiSubItems = [
    { 
      label: LABELS.RESTAURANT.BIZ_SUGGESTIONS, 
      onClick: () => {
        setActiveTab('overview');
        setTimeout(() => scrollToSection('ai-insights-section'), 100);
      }
    },
    { 
      label: LABELS.RESTAURANT.SUGGESTION_HISTORY, 
      active: activeTab === 'ai-history', 
      onClick: () => setActiveTab('ai-history')
    }
  ];

  return (
    <div className="admin-layout flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Main Container below Top Navbar */}
      <div className="flex pt-20 min-h-[calc(100vh-5rem)] w-full">
        {/* Sidebar shifted down and logo hidden */}
        <Sidebar 
          showBrand={false} 
          className="top-20 h-[calc(100vh-5rem)] pt-4"
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleCollapse}
          footer={
            <div className="space-y-2 w-full">
              {/* Facebook style action buttons */}
              <Button
                onClick={actions.handleOpenAdd}
                className={`w-full bg-primary hover:bg-primary-light text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-primary/20 cursor-pointer ${
                  isCollapsed ? 'p-3 aspect-square' : 'py-3 px-4 gap-2 hover:scale-[1.02] active:scale-95'
                }`}
                title={LABELS.RESTAURANT.ADD_FOOD}
              >
                <Plus size={18} />
                {!isCollapsed && <span>{LABELS.RESTAURANT.ADD_FOOD_MENU}</span>}
              </Button>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                variant="outline"
                className={`w-full border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isCollapsed ? 'p-3 aspect-square' : 'py-3 px-4 gap-2 hover:bg-gray-50 dark:hover:bg-slate-950'
                }`}
                title={LABELS.RESTAURANT.IMPORT_EXCEL_MENU}
              >
                <FileUp size={18} />
                {!isCollapsed && <span>{LABELS.RESTAURANT.IMPORT_EXCEL_MENU}</span>}
              </Button>
            </div>
          }
        >
          <SidebarItem 
            icon={BarChart3} 
            label={LABELS.RESTAURANT.TABS.OVERVIEW} 
            active={['overview', 'views', 'interactions', 'conversion', 'activity'].includes(activeTab)} 
            subItems={overviewSubItems}
          />
          <SidebarItem 
            icon={Pizza} 
            label={LABELS.RESTAURANT.TABS.MENU} 
            active={activeTab === 'menu' || activeTab === 'categories'} 
            subItems={menuSubItems}
          />
          <SidebarItem 
            icon={Sparkles} 
            label={LABELS.RESTAURANT.AI_ASSISTANT} 
            active={activeTab === 'ai-history'} 
            subItems={aiSubItems}
          />
          <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
        </Sidebar>

        {/* Content Area */}
        <main className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-80'}`}>
          <motion.div
            initial={{ opacity: 0, x: slideDirection === 'left' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            className="w-full h-full"
          >
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                  {LABELS.RESTAURANT.DASHBOARD_TITLE}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {LABELS.RESTAURANT.SUBTITLE}
                </p>
              </header>

              {/* 2-Column Facebook Studio layout style */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Analytics Chart & Recent Activity */}
                <div className="lg:col-span-2 space-y-8">
                  {/* KPI stats & double bar chart nested in MerchantAnalytics */}
                  <MerchantAnalytics />

                  {/* Recent Activity Card Container */}
                  <div id="recent-activity" className="card-container p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
                    <h3 className="text-body font-black text-gray-800 dark:text-slate-100 mb-6">{LABELS.RESTAURANT.RECENT_ACTIVITY}</h3>
                    <div className="space-y-4">
                      {myFoods.slice(0, LIMITS.RECENT_VIEWS_DASHBOARD).map((food, i) => (
                        <div key={i} className="flex items-center gap-6 p-3 hover:bg-gray-50 dark:hover:bg-slate-950/50 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-800">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                            <SafeImage
                              src={getValidImageUrl(food.image)}
                              className="object-cover"
                              alt={food.name || LABELS.COMMON.UNKNOWN}
                              fill
                              sizes="56px"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 text-sm">{food.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold">{LABELS.RESTAURANT.STATUS}: <span className="text-primary font-bold">{food.status}</span></p>
                          </div>
                          <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{formatCurrency(food.price)}</p>
                        </div>
                      ))}
                      {myFoods.length === 0 && <p className="text-center text-gray-400 py-8 text-xs">{LABELS.RESTAURANT.NO_FOOD}</p>}
                    </div>
                  </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-8">
                  {/* Widget 1: Trạng thái Cửa hàng (Page Status style) */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">{LABELS.RESTAURANT.STORE_STATUS}</h3>
                    <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 dark:bg-slate-950/50 border border-gray-50 dark:border-slate-900 rounded-2xl mb-6">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-slate-850 shadow-md bg-gray-100 dark:bg-slate-800 mb-3 flex items-center justify-center">
                        {restaurant?.profile?.logo ? (
                          <SafeImage
                            src={getValidImageUrl(restaurant.profile.logo)}
                            alt={restaurant.name || "Restaurant"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Store size={40} className="text-gray-400" />
                        )}
                        
                        {/* Active Status Badge */}
                        <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center ${isRestaurantActive ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {isRestaurantActive ? (
                            <Check className="w-2.5 h-2.5 text-white font-bold" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-white font-bold" />
                          )}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-gray-800 dark:text-white text-body">{restaurant?.name || LABELS.COMMON.UNKNOWN}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-0.5">
                        {isRestaurantActive ? LABELS.RESTAURANT.STATUS_OPEN : LABELS.RESTAURANT.STATUS_CLOSED}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/50 pb-3">
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-bold">{LABELS.COMMON.STATUS}</span>
                        <Button
                          onClick={actions.toggleRestaurantStatus}
                          variant="none"
                          size="none"
                          className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isRestaurantActive ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-800'}`}
                        >
                          <div
                            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isRestaurantActive ? 'translate-x-6' : 'translate-x-0'}`}
                          >
                            {isRestaurantActive ? (
                              <Check className="w-3 h-3 text-emerald-500 font-bold" />
                            ) : (
                              <X className="w-3 h-3 text-rose-500 font-bold" />
                            )}
                          </div>
                        </Button>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-2">{LABELS.RESTAURANT.OPERATING_HOURS}</label>
                        <div className="flex gap-2">
                          <Input
                            variant="none"
                            type="text"
                            placeholder={LABELS.RESTAURANT.HOURS_PLACEHOLDER}
                            value={openingHoursText}
                            onChange={(e) => setOpeningHoursText((e.target as HTMLInputElement).value)}
                            className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary dark:text-slate-200"
                          />
                          <Button
                            onClick={() => {
                              actions.updateProfileHours(openingHoursText);
                            }}
                            className="text-xs py-2 px-3"
                          >
                            {LABELS.RESTAURANT.SAVE}
                          </Button>
                        </div>
                      </div>

                      {restaurant?.profile?.contactPhone && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{LABELS.RESTAURANT.CONTACT_PHONE}</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{restaurant.profile.contactPhone}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-50 dark:border-slate-800/50 pt-4">
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => setIsEditModalOpen(true)}
                          className="rounded-xl flex items-center justify-center gap-2 border-gray-200 text-gray-700 dark:text-slate-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 text-xs py-2.5 font-bold"
                        >
                          <Store size={14} />
                          <span>{LABELS.COMMON.EDIT} {LABELS.RESTAURANT.EDIT_STORE}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights Section */}
                  <AiInsightsSection myFoods={myFoods} restaurantName={restaurant?.name} />

                  {/* Widget 2: AI Suggestion Box (Orange gradient) */}
                  <div className="gradient-bg rounded-card p-6 text-white shadow-xl shadow-orange-100 dark:shadow-none relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                      <Sparkles size={160} />
                    </div>
                    <Sparkles size={36} className="mb-4 opacity-60" />
                    <h3 className="text-lg font-black !text-white mb-2">{LABELS.RESTAURANT.AI_SUGGESTION_TITLE}</h3>
                    <p className="text-xs text-orange-50 mb-6 leading-relaxed font-bold">
                      {myFoods && myFoods.length > 0
                        ? typeof LABELS.RESTAURANT.AI_SUGGESTION_DESC === 'function'
                          ? LABELS.RESTAURANT.AI_SUGGESTION_DESC(myFoods[0].name)
                          : `Món "${myFoods[0].name}" của quán đang có hiệu suất hiển thị rất tốt. Bạn có muốn đẩy mạnh chiến dịch quảng bá món này qua trợ lý AI không?`
                        : LABELS.RESTAURANT.AI_SUGGESTION_EMPTY}
                    </p>
                    <Button variant="secondary" fullWidth className="text-xs font-bold py-2.5">{LABELS.RESTAURANT.VIEW_INSIGHT}</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'menu' && (
          <MenuTable
            myFoods={myFoods}
            loading={loading}
            actions={{
              onEdit: actions.onEdit,
              onDelete: actions.onDelete,
              onAdd: actions.handleOpenAdd,
              onUploadExcel: () => setIsUploadModalOpen(true)
            }}
          />
        )}

        {activeTab === 'categories' && restaurant && (
          <CategoryManager restaurantId={restaurant.id} />
        )}

        {activeTab === 'ai-history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                {LABELS.RESTAURANT.AI_HISTORY}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {LABELS.RESTAURANT.AI_HISTORY_DESC}
              </p>
            </header>
            <div className="card-container p-12 text-center text-gray-400 font-medium">
              {LABELS.RESTAURANT.HISTORY_AI_CHAT_NOTE}
            </div>
          </div>
        )}

        {activeTab === 'views' && (
          <ViewsAnalyticsTab />
        )}

        {activeTab === 'interactions' && (
          <InteractionsAnalyticsTab />
        )}

        {activeTab === 'conversion' && (
          <ConversionAnalyticsTab />
        )}

        {activeTab === 'activity' && (
          <ActivityAnalyticsTab />
        )}
          </motion.div>
      </main>
    </div>

    <AnimatePresence>
        {isAddingFood && (
          <FoodFormModal
            key="food-form-modal"
            isOpen={isAddingFood}
            onClose={() => setIsAddingFood(false)}
            editingFood={editingFood}
            formData={formData}
            setFormData={(data) => setFormData({
              name: String(data.name ?? ''),
              price: String(data.price ?? ''),
              description: String(data.description ?? ''),
              image: String(data.image ?? ''),
              tags: String(data.tags ?? ''),
              address: String(data.address ?? ''),
              mapUrl: String(data.mapUrl ?? ''),
              lat: String(data.lat ?? ''),
              lng: String(data.lng ?? ''),
              restaurantId: String(data.restaurantId ?? ''),
              categoryId: String(data.categoryId ?? ''),
            })}
            onSubmit={actions.handleSubmit}
            myBranches={myBranches}
            onSelectBranch={actions.handleSelectBranch}
          />
        )}
        {deleteConfirmId !== null && (
          <ConfirmModal
            key="delete-confirm-modal"
            isOpen={deleteConfirmId !== null}
            title={LABELS.RESTAURANT.DELETE_FOOD_CONFIRM_TITLE}
            message={LABELS.RESTAURANT.DELETE_FOOD_CONFIRM}
            onConfirm={actions.onConfirmDelete}
            onCancel={() => setDeleteConfirmId(null)}
            confirmText={LABELS.COMMON.DELETE}
            cancelText={LABELS.COMMON.CANCEL}
            variant="danger"
          />
        )}
        {isUploadModalOpen && (
          <UploadExcelModal
            key="upload-excel-modal"
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            myBranches={myBranches}
            onSuccess={() => {
              setIsUploadModalOpen(false);
              fetchMyFoods();
            }}
          />
        )}
        {isEditModalOpen && (
          <EditRestaurantModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            restaurant={restaurant}
            onSave={actions.updateRestaurantProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
