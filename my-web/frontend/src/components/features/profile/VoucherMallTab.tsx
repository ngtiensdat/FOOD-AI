/**
 * Mục đích file này để làm gì: Component Tab Chợ Voucher của Trang cá nhân.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị các voucher có thể đổi bằng điểm thưởng tích lũy (loyalty points).
 * Các chức năng đặc biệt: Cho phép đổi điểm lấy voucher thực tế, lưu danh sách voucher đã đổi vào localStorage, cập nhật điểm lên ProfileHeader thông qua callback.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Award, Ticket, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { formatDateTime } from '@/utils/formatters';
import { voucherService } from '@/services/voucher.service';

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
  minSpend: string;
  expiryDays: number;
}

interface VoucherMallTabProps {
  currentPoints: number;
  onUpdatePoints: (newPoints: number) => void;
}


export const VoucherMallTab = ({ currentPoints, onUpdatePoints }: VoucherMallTabProps) => {
  const [myVouchers, setMyVouchers] = useState<Array<{ code: string; title: string; redeemedAt: string }>>([]);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch vouchers and history on mount
  useEffect(() => {
    async function loadVouchersData() {
      setLoading(true);
      try {
        const [availList, redeemedList] = await Promise.all([
          voucherService.getVouchers(),
          voucherService.getMyVouchers()
        ]);
        interface RedeemedVoucherResponse {
          code: string;
          voucher?: {
            title?: string;
          };
          redeemedAt?: string;
          createdAt?: string;
        }
        setAvailableVouchers(availList || []);
        // Format redeemed list to match { code, title, redeemedAt }
        const formatted = (redeemedList || []).map((uv: RedeemedVoucherResponse) => ({
          code: uv.code,
          title: uv.voucher?.title || 'Voucher',
          redeemedAt: formatDateTime(uv.redeemedAt || uv.createdAt)
        }));
        setMyVouchers(formatted);
      } catch (err) {
        console.error('Lỗi khi tải vouchers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVouchersData();
  }, []);

  const handleRedeem = async (voucher: Voucher) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (currentPoints < voucher.pointsCost) {
      setErrorMsg(LABELS.LOYALTY.REDEEM_ERROR);
      setTimeout(() => setErrorMsg(null), LIMITS.ERROR_MSG_AUTO_HIDE_MS);
      return;
    }

    try {
      const redeemed = await voucherService.redeemVoucher(voucher.id);
      
      // Deduct points
      const nextPoints = currentPoints - voucher.pointsCost;
      onUpdatePoints(nextPoints);

      // Add to user vouchers list
      const newRedeemed = {
        code: redeemed.code,
        title: voucher.title,
        redeemedAt: formatDateTime(new Date())
      };
      setMyVouchers(prev => [newRedeemed, ...prev]);

      setSuccessMsg(LABELS.LOYALTY.REDEEM_SUCCESS_WITH_CODE(redeemed.code));
      setTimeout(() => setSuccessMsg(null), LIMITS.SUCCESS_MSG_AUTO_HIDE_MS);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      setErrorMsg(errorResponse.message || 'Lỗi khi đổi điểm lấy voucher!');
      setTimeout(() => setErrorMsg(null), LIMITS.ERROR_MSG_AUTO_HIDE_MS);
    }
  };

  return (
    <section className="space-y-8 fade-in">
      {/* Points Overview Dashboard Card */}
      <div className="card-premium p-8 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full filter blur-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
              <Award size={36} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-h2 !text-2xl text-gray-900">{LABELS.LOYALTY.TITLE}</h2>
              <p className="text-small text-gray-500 mt-1">
                {LABELS.LOYALTY.VOUCHER_EARN_DESC}
              </p>
            </div>
          </div>
          <div className="text-center md:text-right px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-amber-200 dark:border-amber-950/60 shadow-md min-w-[200px]">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{LABELS.LOYALTY.POINTS_BALANCE}</p>
            <p className="text-h1 !text-4xl text-amber-500 mt-1 font-extrabold flex items-center justify-center md:justify-end gap-1.5">
              <span>⭐</span>
              <span>{currentPoints.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Global Notifications inside tab */}
        {successMsg && (
          <div className="mt-6 flex items-center gap-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 text-sm font-bold animate-pulse">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-6 flex items-center gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-sm font-bold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vouchers Shop List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-h3 text-gray-900 flex items-center gap-2">
            <Ticket size={22} className="text-primary" /> {LABELS.LOYALTY.VOUCHERS_TITLE}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableVouchers.map((voucher) => {
              const canAfford = currentPoints >= voucher.pointsCost;
              return (
                <div
                  key={voucher.id}
                  className={`card-premium p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                    canAfford
                      ? 'hover:border-primary/40 hover:-translate-y-1'
                      : 'opacity-75'
                  }`}
                >
                  {/* Voucher Left Design Cutout */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full border-y border-r border-gray-200 dark:border-slate-800" />
                  {/* Voucher Right Design Cutout */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full border-y border-l border-gray-200 dark:border-slate-800" />

                  <div className="pl-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-h2 !text-2xl text-primary font-black">{voucher.discountValue}</span>
                      <span className="text-mini font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md">
                        {LABELS.LOYALTY.REQUIRED_POINTS(voucher.pointsCost)}
                      </span>
                    </div>

                    <h4 className="text-body font-bold text-gray-800 mt-3">{voucher.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{voucher.description}</p>

                    <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-800 text-mini text-gray-400 font-bold">
                      <span>{LABELS.LOYALTY.VOUCHER_MIN_SPEND_PREFIX}{voucher.minSpend}</span>
                      <span>{LABELS.LOYALTY.VOUCHER_EXPIRY_PREFIX}{voucher.expiryDays}{LABELS.LOYALTY.VOUCHER_EXPIRY_SUFFIX}</span>
                    </div>
                  </div>

                  <div className="mt-6 pl-2">
                    <Button
                      variant={canAfford ? 'primary' : 'secondary'}
                      disabled={!canAfford}
                      onClick={() => handleRedeem(voucher)}
                      className="w-full text-xs font-bold"
                    >
                      {canAfford ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Sparkles size={14} /> {LABELS.LOYALTY.REDEEM}
                        </span>
                      ) : (
                        LABELS.LOYALTY.REDEEM_ERROR.split('.')[0]
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redeemed Vouchers History */}
        <div className="space-y-6">
          <h3 className="text-h3 text-gray-900 flex items-center gap-2">
            <CheckCircle2 size={22} className="text-emerald-500" /> {LABELS.LOYALTY.MY_VOUCHERS_TITLE}
          </h3>

          <div className="card-premium p-6 space-y-4 max-h-[450px] overflow-y-auto">
            {myVouchers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Ticket size={36} className="mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                <p className="text-xs">{LABELS.LOYALTY.VOUCHER_EMPTY}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myVouchers.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-800 text-sm">{item.title}</span>
                      <span className="text-mini bg-emerald-500/10 text-emerald-500 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {LABELS.LOYALTY.VOUCHER_REDEEMED_BADGE}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-mini text-gray-400 font-bold">
                      <span>{LABELS.LOYALTY.VOUCHER_CODE_PREFIX}<code className="text-gray-900 dark:text-white font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">{item.code}</code></span>
                      <span>{item.redeemedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
