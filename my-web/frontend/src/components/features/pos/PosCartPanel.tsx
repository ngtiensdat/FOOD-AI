'use client';

import React from 'react';
import { ShoppingBag, Plus, Minus, Trash2, Tag, X, Send } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { formatCurrency } from '@/utils/formatters';
import { getValidImageUrl } from '@/utils/helpers';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
}

interface AppliedVoucher {
  code: string;
  title: string;
}

interface CartTotals {
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

interface PosCartPanelProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  updateCartQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  verifyingVoucher: boolean;
  appliedVoucher: AppliedVoucher | null;
  handleVerifyVoucher: () => void;
  handleCancelVoucher: () => void;
  submittingOrder: boolean;
  handleCreateOrder: () => void;
}

export const PosCartPanel = ({
  cart,
  cartTotals,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  voucherCode,
  setVoucherCode,
  verifyingVoucher,
  appliedVoucher,
  handleVerifyVoucher,
  handleCancelVoucher,
  submittingOrder,
  handleCreateOrder,
}: PosCartPanelProps) => {
  return (
    <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
      
      {/* Cart Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col flex-1 max-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/60 pb-3 mb-3">
          <h2 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} className="text-primary" />
            {LABELS.POS.CART_TITLE(cartTotals.totalItems)}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
            >
              {LABELS.POS.CLEAR_ALL}
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[22rem]">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-850/80 rounded-xl"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-50 dark:border-slate-850">
                <SafeImage src={getValidImageUrl(item.image)} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">
                  {item.name}
                </h4>
                <span className="text-[10px] text-primary font-black block mt-0.5">
                  {formatCurrency(item.price)}
                </span>
              </div>
              
              {/* Quantity adjustment buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateCartQuantity(item.id, -1)}
                  className="w-5 h-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <span className="text-xs font-black w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.id, 1)}
                  className="w-5 h-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-gray-400 hover:text-rose-500 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingBag size={32} className="text-gray-300 mb-2" />
              <span className="text-[11px] font-bold">{LABELS.POS.SELECT_FOOD_PROMPT}</span>
            </div>
          )}
        </div>

        {/* Voucher Input Section */}
        {cart.length > 0 && (
          <div className="border-t border-gray-50 dark:border-slate-800/60 pt-4 mt-3">
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
              {LABELS.POS.VOUCHER_SECTION_TITLE}
            </label>
            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag size={14} className="shrink-0" />
                  <div className="truncate">
                    <span className="block font-black">{appliedVoucher.code}</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">{appliedVoucher.title}</span>
                  </div>
                </div>
                <button
                  onClick={handleCancelVoucher}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  variant="none"
                  type="text"
                  placeholder={LABELS.POS.VOUCHER_PLACEHOLDER}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode((e.target as HTMLInputElement).value)}
                  className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-primary"
                />
                <Button
                  onClick={handleVerifyVoucher}
                  disabled={verifyingVoucher || !voucherCode.trim()}
                  className="text-xs py-2 px-3 shrink-0"
                >
                  {verifyingVoucher ? LABELS.POS.VERIFYING : LABELS.POS.APPLY}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Cost Details summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-50 dark:border-slate-800/60 pt-4 mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500 dark:text-slate-400 font-bold">
              <span>{LABELS.POS.SUBTOTAL}</span>
              <span>{formatCurrency(cartTotals.subtotal)}</span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>{LABELS.POS.DISCOUNT}</span>
                <span>-{formatCurrency(cartTotals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-900 dark:text-white font-black text-sm border-t border-dashed border-gray-100 dark:border-slate-850 pt-2 mt-1">
              <span>{LABELS.POS.TOTAL_TO_PAY}</span>
              <span className="text-primary text-base font-black">
                {formatCurrency(cartTotals.total)}
              </span>
            </div>
          </div>
        )}

        {/* Action Checkout button */}
        {cart.length > 0 && (
          <div className="pt-4 mt-auto">
            <Button
              onClick={handleCreateOrder}
              disabled={submittingOrder}
              fullWidth
              className="py-3 rounded-2xl flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-black shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              <Send size={16} />
              <span>{LABELS.POS.SUBMIT_ORDER}</span>
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
