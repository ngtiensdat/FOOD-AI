'use client';

import React from 'react';
import { Laptop } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/features/Navbar';
import { usePos, PosTableSelector, PosMenuGrid, PosCartPanel, PosTransferModal, PosPaymentModal } from '@/components/features/pos';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

export default function PosPage() {
  const { user, login: updateMe } = useAuth();
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
    activeTerminal,
    handleLoginTerminal,
    handleLogoutTerminal,
    paymentMethod,
    setPaymentMethod,
  } = usePos({ user });

  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [terminalCode, setTerminalCode] = React.useState('');

  React.useEffect(() => {
    if (!user?.id) return;
    const syncProfile = async () => {
      try {
        const { authService } = await import('@/services/auth.service');
        const freshProfile = await authService.getProfile(Number(user.id));
        if (freshProfile) {
          updateMe(freshProfile);
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ hồ sơ người dùng:', err);
      }
    };
    syncProfile();
  }, [user?.id, updateMe]);
  const [terminalPassword, setTerminalPassword] = React.useState('');
  const [loggingIn, setLoggingIn] = React.useState(false);

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    const success = await handleLoginTerminal(terminalCode, terminalPassword);
    setLoggingIn(false);
    if (success) {
      setTerminalCode('');
      setTerminalPassword('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-lg bg-gray-50 dark:bg-slate-950">
        {LABELS.POS.LOADING_USER}
      </div>
    );
  }

  // Khóa màn hình yêu cầu xác thực thiết bị nếu là nhân viên
  if (user.role === 'STAFF' && !activeTerminal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-200 pt-20">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 p-8 rounded-3xl shadow-lg max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Laptop size={32} />
              </div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">
                {LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.TITLE}
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                {LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.DESC}
              </p>
            </div>

            <form onSubmit={handleTerminalSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-1">
                  {LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.CODE_LABEL}
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Nhập mã máy POS..."
                  value={terminalCode}
                  onChange={(e) => setTerminalCode(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-primary text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-1">
                  {LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.PASSWORD_LABEL}
                </label>
                <input 
                  type="password" 
                  required 
                  placeholder="Nhập mật khẩu máy POS..."
                  value={terminalPassword}
                  onChange={(e) => setTerminalPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-primary text-slate-800 dark:text-slate-200"
                />
              </div>

              <Button 
                type="submit" 
                fullWidth 
                disabled={loggingIn}
                className="bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2"
              >
                {loggingIn ? 'Đang xác thực...' : LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.SUBMIT}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-200 pt-20">
      <Navbar />

      {/* Banner thông tin máy POS hoạt động */}
      {user.role === 'STAFF' && activeTerminal && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 py-3 px-6 text-xs font-bold text-amber-700 dark:text-amber-400 flex justify-between items-center rounded-2xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Thiết bị POS active: <strong className="text-gray-900 dark:text-white font-extrabold">{activeTerminal.name}</strong> (Mã: {activeTerminal.code})
              </span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi máy POS này?')) {
                  handleLogoutTerminal();
                }
              }}
              className="text-red-500 hover:text-red-600 transition-colors uppercase text-[10px] tracking-wider font-extrabold cursor-pointer hover:underline"
            >
              {LABELS.RESTAURANT.POS_TERMINAL_MANAGER.LOGIN_MODAL.LOGOUT_BTN}
            </button>
          </div>
        </div>
      )}

      {/* Main content under navbar */}
      <div className="flex-1 pt-6 px-4 md:px-8 pb-8 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        
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
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
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

      {/* Modal thanh toán chuyển khoản PayOS */}
      {isPaymentModalOpen && (
        <PosPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={cartTotals.total}
          tableName={tables.find((t) => t.id === selectedTableId)?.name || 'Mang ve'}
          onPaymentSuccess={handleCreateOrder}
        />
      )}
    </div>
  );
}
