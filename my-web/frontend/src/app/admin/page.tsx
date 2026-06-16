/**
 * @fileoverview frontend/src/app/admin/page.tsx
 * @module AdminDashboard
 * @description Trang điều phối (Orchestrator) chính của giao diện Admin. Lắp ráp các tính năng quản lý (User, Food, Category) và hoàn toàn không chứa logic nghiệp vụ, giao phó cho các Custom Hooks (`useAdminData`, `useAdminActions`).
 */
'use client';

import React from 'react';
import { Shield, Check, Users, Store, ArrowLeft, Search, Pizza, ChevronDown, ShieldAlert, Award, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions'; // Logic được tách ra đây
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Avatar } from '@/components/base/Avatar';
import { UserDropdown } from '@/components/features/UserDropdown'; // Tái sử dụng component UserDropdown
import { LABELS } from '@/constants/labels';
// Feature Components
import { AdminTable } from '@/components/features/admin/AdminTable';
import { AdminFoodModal } from '@/components/features/admin/AdminFoodModal';
import { AdminImportExcelModal } from '@/components/features/admin/AdminImportExcelModal';
import { FileUp } from 'lucide-react';
import { ModerationTab } from '@/components/features/admin/ModerationTab';
import { LevelBadgeManagerTab } from '@/components/features/admin/LevelBadgeManagerTab';
import { AdminNotificationTab } from '@/components/features/admin/AdminNotificationTab';

export default function AdminDashboard() {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Bảo vệ route - Tự động redirect nếu chưa đăng nhập hoặc không phải ADMIN
  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [user, authLoading, isAdmin, router]);

  const adminData = useAdminData();
  const [showImportModal, setShowImportModal] = React.useState(false);

  const {
    activeTab,
    setActiveTab,
    foodSubTab,
    setFoodSubTab,
    editingFood,
    setEditingFood,
    editFormData,
    setEditFormData,
    searchQuery,
    setSearchQuery,
    showMenu,
    setShowMenu,
    deleteFoodId,
    setDeleteFoodId,
    deleteUserId,
    setDeleteUserId,
    getFilteredMerchants,
    getFilteredUsers,
    getFilteredCustomers,
    getFilteredFoods,
    actions
  } = useAdminActions(adminData);

  const { loading } = adminData;
  const filteredMerchants = getFilteredMerchants();
  const filteredUsers = getFilteredUsers();
  const filteredCustomers = getFilteredCustomers();
  const filteredFoods = getFilteredFoods();

  return (
    <div className="admin-layout">
      <Sidebar brandIcon={Shield} brandLabel={LABELS.ADMIN.PANEL_TITLE}>
        <SidebarItem icon={Check} label={LABELS.ADMIN.APPROVE_MERCHANTS} active={activeTab === 'merchants'} onClick={() => setActiveTab('merchants')} />
        <SidebarItem icon={Store} label={LABELS.ADMIN.MANAGE_MERCHANTS} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <SidebarItem icon={Users} label={LABELS.ADMIN.MANAGE_CUSTOMERS} active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
        <SidebarItem icon={Pizza} label={LABELS.ADMIN.MANAGE_MENU} active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
        <SidebarItem icon={ShieldAlert} label={LABELS.MODERATION.TITLE} active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} />
        <SidebarItem icon={Award} label={LABELS.ADMIN.MANAGE_LEVEL_BADGES} active={activeTab === 'levels'} onClick={() => setActiveTab('levels')} />
        <SidebarItem icon={Bell} label={LABELS.ADMIN.SEND_NOTIFICATION} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
        <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
      </Sidebar>

      <main className="admin-main">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col">
            <h2 className="text-h2 text-gray-800">
              {activeTab === 'merchants' ? LABELS.ADMIN.APPROVE_MERCHANTS :
                activeTab === 'menu' ? LABELS.ADMIN.MANAGE_MENU :
                  activeTab === 'users' ? LABELS.ADMIN.MANAGE_MERCHANTS :
                    activeTab === 'moderation' ? LABELS.MODERATION.TITLE :
                      activeTab === 'levels' ? LABELS.ADMIN.MANAGE_LEVEL_BADGES :
                        activeTab === 'notifications' ? LABELS.ADMIN.SEND_NOTIFICATION :
                          LABELS.ADMIN.MANAGE_CUSTOMERS}
            </h2>

            {activeTab === 'menu' && (
              <div className="flex gap-6 mt-4 text-small font-bold">
                {[
                  { id: 'merchant', label: LABELS.ADMIN.MERCHANT_FOOD },
                  { id: 'system', label: LABELS.ADMIN.SYSTEM_FOOD }
                ].map(tab => (
                  <Button
                    key={tab.id}
                    onClick={() => setFoodSubTab(tab.id as 'system' | 'merchant')}
                    className={`pb-2 border-b-2 transition-all ${foodSubTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    variant="none"
                    size="none"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== 'moderation' && activeTab !== 'levels' && activeTab !== 'notifications' && (activeTab === 'users' || activeTab === 'menu') && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowImportModal(true)}
              >
                <FileUp className="w-4 h-4" />
                {LABELS.ADMIN.IMPORT_EXCEL}
              </Button>
            )}
            {activeTab !== 'moderation' && activeTab !== 'levels' && activeTab !== 'notifications' && (
              <Input
                icon={Search}
                placeholder={LABELS.COMMON.SEARCH}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80"
              />
            )}
            {user && (
              <div className="flex items-center gap-3 relative">
                <Button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
                  aria-label={LABELS.NAV.USER_MENU}
                  variant="none"
                  size="none"
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
                </Button>

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

        {activeTab === 'moderation' ? (
          <ModerationTab />
        ) : activeTab === 'levels' ? (
          <LevelBadgeManagerTab />
        ) : activeTab === 'notifications' ? (
          <AdminNotificationTab allUsers={adminData.allUsers} adminAvatar={user?.avatar || undefined} />
        ) : (
          <AdminTable
            activeTab={activeTab as any}
            foodSubTab={foodSubTab}
            loading={loading}
            merchants={filteredMerchants}
            users={filteredUsers}
            customers={filteredCustomers}
            foods={filteredFoods}
            actions={actions}
          />
        )}
      </main>

      <AnimatePresence>
        {editingFood && (
          <AdminFoodModal
            editingFood={editingFood}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            onClose={() => setEditingFood(null)}
            onSave={() => actions.handleUpdateFood(editingFood.id, editFormData)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteFoodId !== null}
        title={LABELS.ADMIN.CONFIRM.DELETE_FOOD}
        message={LABELS.ADMIN.CONFIRM.DELETE_FOOD_DESC}
        onConfirm={actions.confirmDeleteFood}
        onCancel={() => setDeleteFoodId(null)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!deleteUserId}
        title={LABELS.ADMIN.CONFIRM_DELETE_USER}
        message={LABELS.ADMIN.DELETE_WARNING}
        onConfirm={actions.confirmDeleteUser}
        onCancel={() => setDeleteUserId(null)}
        variant="danger"
      />

      <AdminImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          // Tải lại dữ liệu sau khi import
          adminData.fetchData();
        }}
      />
    </div>
  );
}
