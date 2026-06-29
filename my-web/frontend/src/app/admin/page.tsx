/**
 * @fileoverview frontend/src/app/admin/page.tsx
 * @module AdminDashboard
 * @description Trang điều phối (Orchestrator) chính của giao diện Admin. Lắp ráp các tính năng quản lý (User, Food, Category) và hoàn toàn không chứa logic nghiệp vụ, giao phó cho các Custom Hooks (`useAdminData`, `useAdminActions`).
 */
'use client';

import React from 'react';
import { Shield, Check, Users, Store, ArrowLeft, Search, Pizza, ChevronDown, ShieldAlert, Award, Bell, Home, Compass, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions'; // Logic được tách ra đây
import { Sidebar, SidebarItem, useSidebarCollapse } from '@/components/base/Sidebar';
import { Navbar } from '@/components/features/Navbar';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Avatar } from '@/components/base/Avatar';
import { UserDropdown } from '@/components/features/UserDropdown'; // Tái sử dụng component UserDropdown
import { ThemeToggle } from '@/components/base/ThemeToggle';
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
  const { user, logout, isAdmin, isRestaurant, loading: authLoading } = useAuth();
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

  const [slideDirection, setSlideDirection] = React.useState<'left' | 'right'>('left');
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const prevPath = sessionStorage.getItem('prevPath') || '';
      sessionStorage.setItem('prevPath', '/admin');
      if (prevPath) {
        const pathOrder = ['/dashboard', '/restaurant-admin', '/admin'];
        const prevIndex = pathOrder.indexOf(prevPath);
        const currentIndex = pathOrder.indexOf('/admin');
        if (prevIndex !== -1 && currentIndex !== -1) {
          setSlideDirection(currentIndex > prevIndex ? 'left' : 'right');
        }
      }
    }
  }, []);

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

  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  const userSubItems = [
    {
      label: LABELS.ADMIN.APPROVE_MERCHANTS,
      active: activeTab === 'merchants',
      onClick: () => setActiveTab('merchants')
    },
    {
      label: LABELS.ADMIN.MANAGE_MERCHANTS,
      active: activeTab === 'users',
      onClick: () => setActiveTab('users')
    },
    {
      label: LABELS.ADMIN.MANAGE_CUSTOMERS,
      active: activeTab === 'customers',
      onClick: () => setActiveTab('customers')
    }
  ];

  const contentSubItems = [
    {
      label: LABELS.ADMIN.MANAGE_MENU,
      active: activeTab === 'menu',
      onClick: () => setActiveTab('menu')
    },
    {
      label: LABELS.MODERATION.TITLE,
      active: activeTab === 'moderation',
      onClick: () => setActiveTab('moderation')
    }
  ];

  const systemSubItems = [
    {
      label: LABELS.ADMIN.MANAGE_LEVEL_BADGES,
      active: activeTab === 'levels',
      onClick: () => setActiveTab('levels')
    },
    {
      label: LABELS.ADMIN.SEND_NOTIFICATION,
      active: activeTab === 'notifications',
      onClick: () => setActiveTab('notifications')
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
        >
          <SidebarItem 
            icon={Users} 
            label={LABELS.ADMIN.MANAGE_USERS_TITLE} 
            active={activeTab === 'merchants' || activeTab === 'users' || activeTab === 'customers'} 
            subItems={userSubItems} 
          />
          <SidebarItem 
            icon={Pizza} 
            label={LABELS.ADMIN.MANAGE_CONTENT_TITLE} 
            active={activeTab === 'menu' || activeTab === 'moderation'} 
            subItems={contentSubItems} 
          />
          <SidebarItem 
            icon={Award} 
            label={LABELS.ADMIN.SYSTEM_CONFIG_TITLE} 
            active={activeTab === 'levels' || activeTab === 'notifications'} 
            subItems={systemSubItems} 
          />
          <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
        </Sidebar>

        {/* Content Area */}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'}`}>
          <motion.div
            initial={{ opacity: 0, x: slideDirection === 'left' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            className="w-full h-full"
          >
          {activeTab === 'moderation' ? (
            <ModerationTab />
          ) : activeTab === 'levels' ? (
            <LevelBadgeManagerTab />
          ) : activeTab === 'notifications' ? (
            <AdminNotificationTab allUsers={adminData.allUsers} adminAvatar={user?.avatar || undefined} />
          ) : (
            <AdminTable
              activeTab={activeTab}
              foodSubTab={foodSubTab}
              setFoodSubTab={setFoodSubTab}
              loading={loading}
              merchants={filteredMerchants}
              users={filteredUsers}
              customers={filteredCustomers}
              foods={filteredFoods}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onImportExcelClick={() => setShowImportModal(true)}
              actions={actions}
            />
          )}
          </motion.div>
      </main>
      </div>

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
