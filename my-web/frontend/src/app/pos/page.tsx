'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePos } from '@/hooks/usePos';
import { Navbar } from '@/components/features/Navbar';
import { PosTableSelector, PosMenuGrid, PosCartPanel, PosTransferModal } from '@/components/features/pos';
import { LABELS } from '@/constants/labels';

export default function PosPage() {
  const { user } = useAuth();
  const {
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
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    voucherCode,
    setVoucherCode,
    verifyingVoucher,
    appliedVoucher,
    handleVerifyVoucher,
    handleCancelVoucher,
    submittingOrder,
    handleCreateOrder,
    tables,
    selectedTableId,
    setSelectedTableId,
    handleSelectTable,
    handleReleaseTable,
    handleTransferTable,
  } = usePos({ user });

  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-lg bg-gray-50 dark:bg-slate-950">
        {LABELS.POS.LOADING_USER}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-200">
      <Navbar />

      {/* Main content under navbar */}
      <div className="flex-1 pt-20 px-4 md:px-8 pb-8 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        
        {selectedTableId === null ? (
          <PosTableSelector
            user={user}
            tables={tables}
            branches={branches}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            handleSelectTable={handleSelectTable}
            handleReleaseTable={handleReleaseTable}
          />
        ) : (
          <>
            <PosMenuGrid
              user={user}
              tables={tables}
              selectedTableId={selectedTableId}
              setSelectedTableId={setSelectedTableId}
              branches={branches}
              selectedBranchId={selectedBranchId}
              setSelectedBranchId={setSelectedBranchId}
              categoryGroups={categoryGroups}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
              activeCategoryId={activeCategoryId}
              setActiveCategoryId={setActiveCategoryId}
              loadingMenu={loadingMenu}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredMenu={filteredMenu}
              addToCart={addToCart}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
            />

            <PosCartPanel
              cart={cart}
              cartTotals={cartTotals}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              verifyingVoucher={verifyingVoucher}
              appliedVoucher={appliedVoucher}
              handleVerifyVoucher={handleVerifyVoucher}
              handleCancelVoucher={handleCancelVoucher}
              submittingOrder={submittingOrder}
              handleCreateOrder={handleCreateOrder}
            />
          </>
        )}
      </div>

      {/* Modal chọn bàn đổi */}
      {isTransferModalOpen && (
        <PosTransferModal
          tables={tables}
          selectedTableId={selectedTableId}
          handleTransferTable={handleTransferTable}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}
    </div>
  );
}
