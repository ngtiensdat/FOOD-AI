'use client';

import React from 'react';
import { Shield, Check, Users, Store, ArrowLeft, Search, Pizza, Menu } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions'; // Logic được tách ra đây
import { Sidebar, SidebarItem } from '@/components/base/Sidebar';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { UserDropdown } from '@/components/features/UserDropdown'; // Tái sử dụng component UserDropdown
import { LABELS } from '@/constants/labels';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/helpers';

// Feature Components
import { AdminTable } from '@/components/features/AdminTable';
import { AdminFoodModal } from '@/components/features/AdminFoodModal';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const adminData = useAdminData();

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
    getFilteredData,
    actions
  } = useAdminActions(adminData);

  const { loading } = adminData;
  const filteredData = getFilteredData();

  return (
    <div className="admin-layout">
      <Sidebar brandIcon={Shield} brandLabel={LABELS.ADMIN.PANEL_TITLE}>
        <SidebarItem icon={Check} label={LABELS.ADMIN.APPROVE_MERCHANTS} active={activeTab === 'merchants'} onClick={() => setActiveTab('merchants')} />
        <SidebarItem icon={Store} label={LABELS.ADMIN.MANAGE_MERCHANTS} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <SidebarItem icon={Users} label={LABELS.ADMIN.MANAGE_CUSTOMERS} active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
        <SidebarItem icon={Pizza} label={LABELS.ADMIN.MANAGE_MENU} active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
        <SidebarItem icon={ArrowLeft} label={LABELS.COMMON.BACK_HOME} href="/" />
      </Sidebar>

      <main className="admin-main">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col">
            <h2 className="text-h2 text-gray-800">
              {activeTab === 'merchants' ? LABELS.ADMIN.APPROVE_MERCHANTS :
                activeTab === 'menu' ? LABELS.ADMIN.MANAGE_MENU :
                  activeTab === 'users' ? LABELS.ADMIN.MANAGE_MERCHANTS :
                    LABELS.ADMIN.MANAGE_CUSTOMERS}
            </h2>

            {activeTab === 'menu' && (
              <div className="flex gap-6 mt-4 text-small font-bold">
                {[
                  { id: 'system', label: LABELS.ADMIN.SYSTEM_FOOD },
                  { id: 'merchant', label: LABELS.ADMIN.MERCHANT_FOOD }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFoodSubTab(tab.id as any)}
                    className={`pb-2 border-b-2 transition-all ${foodSubTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Input
              icon={Search}
              placeholder={LABELS.COMMON.SEARCH}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
            />
            {user && (
              <div className="flex items-center gap-3 relative">
                <Link
                  href="/profile"
                  className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-all flex items-center justify-center bg-gray-100"
                >
                  {user.avatar ? (
                    <Image src={getValidImageUrl(user.avatar)} alt={user.name || ''} fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

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
                    onSettingsClick={() => { window.location.href = '/'; setShowMenu(false); }}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        <AdminTable 
          activeTab={activeTab}
          foodSubTab={foodSubTab}
          loading={loading}
          filteredData={filteredData}
          actions={actions}
        />
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
        isOpen={deleteUserId !== null}
        title={LABELS.ADMIN.CONFIRM.DELETE_USER}
        message={LABELS.ADMIN.CONFIRM.DELETE_USER_DESC}
        onConfirm={actions.confirmDeleteUser}
        onCancel={() => setDeleteUserId(null)}
        variant="danger"
      />
    </div>
  );
}
