/**
 * Mục đích file này để làm gì: Trang Quản trị viên của Nhà hàng (Restaurant Admin Dashboard). Đóng vai trò Orchestrator quản lý toàn bộ các tính năng như Tổng quan, Danh mục, Thực đơn, Lịch sử AI.
 * Các file khác hay file này có ý nghĩa như nào: Tách bạch hoàn toàn logic và giao diện. Toàn bộ logic được trừu tượng hóa vào `useRestaurantActions`. Các Component con (MenuTable, CategoryManager, UploadExcelModal) đảm nhận render chi tiết.
 * Các chức năng đặc biệt: Toggle trạng thái nhà hàng trực tiếp trên Header, Upload Excel hàng loạt, Quản lý đa cơ sở, Gợi ý AI Insight.
 * Các biến, hàm đặc biệt trong file: `useRestaurantActions` quản lý state toàn cục của Dashboard.
 */
'use client';

import React from 'react';
import {
  Store, BarChart3, ArrowLeft, Pizza, Sparkles, Plus, HelpCircle, FolderTree, ChevronDown, Check, X
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
import { SafeImage } from '@/components/base/SafeImage';
import Link from 'next/link';
import { Avatar } from '@/components/base/Avatar';

// Feature Components
import { MenuTable } from '@/components/features/restaurant/MenuTable';
import { FoodFormModal } from '@/components/features/food/FoodFormModal';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { CategoryManager } from '@/components/features/restaurant/CategoryManager';
import { UploadExcelModal } from '@/components/features/admin/UploadExcelModal';
import { EditRestaurantModal } from '@/components/features/restaurant/EditRestaurantModal';

export default function RestaurantDashboard() {
  const { user, logout } = useAuth();

  // Bảo vệ route - Tự động redirect nếu chưa đăng nhập hoặc không phải RESTAURANT / ADMIN
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const loggedInUser = parsed?.state?.user;
          if (!loggedInUser) {
            window.location.href = '/login';
            return;
          }
          if (loggedInUser.role !== 'RESTAURANT' && loggedInUser.role !== 'ADMIN') {
            window.location.href = '/';
          }
        } catch {
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

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

  return (
    <div className="admin-layout">
      <Sidebar brandIcon={Store} brandLabel={LABELS.RESTAURANT.MERCHANT_HUB}>
        <SidebarItem icon={BarChart3} label={LABELS.RESTAURANT.TABS.OVERVIEW} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <SidebarItem icon={FolderTree} label={LABELS.RESTAURANT.TABS.CATEGORIES} active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
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
              <Sparkles
                size={16}
                className={`transition-all duration-300 ${isRestaurantActive
                  ? 'text-amber-500 animate-pulse drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                  : 'text-gray-300 dark:text-slate-650'
                  }`}
              />
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isRestaurantActive ? LABELS.RESTAURANT.STATUS_OPEN : LABELS.RESTAURANT.STATUS_CLOSED}
              </span>
              <button
                onClick={actions.toggleRestaurantStatus}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isRestaurantActive ? 'bg-primary dark:bg-orange-600' : 'bg-gray-200 dark:bg-slate-800'
                  }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isRestaurantActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                >
                  {isRestaurantActive ? (
                    <Check className="w-3 h-3 text-emerald-500 font-bold" />
                  ) : (
                    <X className="w-3 h-3 text-rose-500 font-bold" />
                  )}
                </div>
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
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsUploadModalOpen(true)} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                  <Plus size={20} className="mr-2" /> {LABELS.RESTAURANT.UPLOAD_EXCEL.TITLE}
                </Button>
                <Button onClick={actions.handleOpenAdd}>
                  <Plus size={24} className="mr-2" /> {LABELS.RESTAURANT.ADD_FOOD}
                </Button>
              </div>
            )}

            {restaurant?.id && (
              <Button
                variant="outline"
                onClick={() => window.open(`/restaurant/${restaurant.id}`, '_blank')}
                className="flex items-center gap-2 rounded-xl h-10 px-4 border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all shadow-sm"
              >
                <Store size={16} />
                <span>{LABELS.RESTAURANT.VIEW_AS_GUEST}</span>
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-3 relative ml-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
                  aria-label={LABELS.NAV.USER_MENU}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size={40}
                    className="border-2 border-white dark:border-slate-700 shadow-md bg-gray-100"
                  />
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 dark:text-slate-400 transition-transform duration-300 ${showMenu ? 'rotate-180 text-primary' : ''
                      }`}
                  />
                </button>

                {showMenu && (
                  <>
                    {/* Lớp phủ trong suốt hỗ trợ đóng menu khi click ra ngoài */}
                    <div
                      className="fixed inset-0 z-40 bg-transparent cursor-default"
                      onClick={() => setShowMenu(false)}
                    />
                    <UserDropdown
                      user={user}
                      onLogout={logout}
                      onSettingsClick={() => { window.location.href = '/?tab=settings'; setShowMenu(false); }}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
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
                      <SafeImage
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
                        placeholder={LABELS.RESTAURANT.HOURS_PLACEHOLDER}
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
                  <div className="border-t border-gray-50 dark:border-slate-800/50 pt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setIsEditModalOpen(true)}
                      className="rounded-xl flex items-center justify-center gap-2 border-gray-200 text-gray-700 dark:text-slate-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900"
                    >
                      <Store size={16} />
                      <span>{LABELS.COMMON.EDIT} cửa hàng</span>
                    </Button>
                  </div>
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

        {activeTab === 'categories' && restaurant && (
          <CategoryManager restaurantId={restaurant.id} />
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
            setFormData={setFormData as any}
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
