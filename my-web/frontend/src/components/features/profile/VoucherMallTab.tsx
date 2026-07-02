/**
 * Mục đích file này để làm gì: Component Tab Chợ Voucher của Trang cá nhân.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị các voucher có thể đổi bằng điểm thưởng tích lũy (loyalty points).
 * Các chức năng đặc biệt: Cho phép đổi điểm lấy voucher thực tế, lưu danh sách voucher đã đổi vào localStorage, cập nhật điểm lên ProfileHeader thông qua callback.
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Award, Ticket, CheckCircle2, AlertCircle, Sparkles, ChevronUp, ChevronDown, Store } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { formatDateTime } from '@/utils/formatters';
import { voucherService } from '@/services/voucher.service';
import { toast } from '@/store/useToastStore';

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
  activeSubTab?: 'MALL' | 'WALLET' | 'CLAIM';
}


export const VoucherMallTab = ({ currentPoints, onUpdatePoints, activeSubTab = 'WALLET' }: VoucherMallTabProps) => {
  interface MyVoucherItem {
    id: string;
    code: string;
    title: string;
    description: string;
    image: string | null;
    redeemedAt: string;
    rawRedeemedAt: string;
    expiryDays: number;
    expiryDate: string | null;
    isUsed: boolean;
  }

  interface MyVoucherRawItem {
    id: string;
    code: string;
    title: string | null;
    description: string | null;
    image: string | null;
    redeemedAt: string;
    expiryDays: number;
    expiryDate: string | null;
    isUsed: boolean;
  }

  const [myVouchers, setMyVouchers] = useState<MyVoucherItem[]>([]);
  const [mallVouchers, setMallVouchers] = useState<Voucher[]>([]);
  const [loadingMall, setLoadingMall] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pointCodeInput, setPointCodeInput] = useState('');
  const [claimingCode, setClaimingCode] = useState(false);

  const handleClaimPointCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pointCodeInput.length !== 6) {
      setErrorMsg(LABELS.LOYALTY.CLAIM_POINT_CODE_INVALID_LENGTH);
      return;
    }

    setClaimingCode(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await voucherService.claimPointCode(pointCodeInput);
      toast.success(LABELS.LOYALTY.CLAIM_POINT_CODE_SUCCESS(res.pointsAwarded));
      setSuccessMsg(LABELS.LOYALTY.CLAIM_POINT_CODE_SUCCESS_DESC(res.pointsAwarded));
      onUpdatePoints(res.nextPoints);
      setPointCodeInput('');
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      const errMsg = errorResponse.message || LABELS.LOYALTY.CLAIM_POINT_CODE_ERROR;
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setClaimingCode(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'MALL') {
      async function loadMallVouchers() {
        setLoadingMall(true);
        try {
          const data = await voucherService.getVouchers();
          setMallVouchers(data || []);
        } catch (err) {
          console.error(LABELS.LOYALTY.LOAD_MALL_ERROR, err);
        } finally {
          setLoadingMall(false);
        }
      }
      loadMallVouchers();
    }
  }, [activeSubTab]);

  const groupedVouchers = useMemo(() => {
    const groups: Record<string, { id: number | null; name: string; list: Voucher[] }> = {};
    mallVouchers.forEach((v: any) => {
      const key = v.restaurantId ? String(v.restaurantId) : 'system';
      if (!groups[key]) {
        groups[key] = {
          id: v.restaurantId || null,
          name: v.restaurantName || LABELS.LOYALTY.SYSTEM_BRAND,
          list: [],
        };
      }
      groups[key].list.push(v);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.id === null) return -1;
      if (b.id === null) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [mallVouchers]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRedeem = async (voucher: Voucher) => {
    if (currentPoints < voucher.pointsCost) {
      toast.error(LABELS.LOYALTY.REDEEM_ERROR);
      return;
    }

    try {
      const redeemed = await voucherService.redeemVoucher(voucher.id);
      const nextPoints = currentPoints - voucher.pointsCost;
      onUpdatePoints(nextPoints);

      toast.success(LABELS.LOYALTY.REDEEM_SUCCESS_WITH_CODE(redeemed.code));
      
      // Reload my vouchers
      const redeemedList = await voucherService.getMyVouchers();
      const formatted = (redeemedList || []).map((uv: MyVoucherRawItem) => ({
        id: uv.id,
        code: uv.code,
        title: uv.title || 'Voucher',
        description: uv.description || '',
        image: uv.image,
        redeemedAt: formatDateTime(uv.redeemedAt),
        rawRedeemedAt: uv.redeemedAt,
        expiryDays: uv.expiryDays,
        expiryDate: uv.expiryDate,
        isUsed: uv.isUsed
      }));
      setMyVouchers(formatted);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.LOYALTY.REDEEM_ERROR_VOUCHER);
    }
  };

  // Fetch history on mount
  useEffect(() => {
    async function loadVouchersData() {
      setLoading(true);
      try {
        const redeemedList = await voucherService.getMyVouchers();
        // Format redeemed list to match MyVoucherItem
        const formatted = (redeemedList || []).map((uv: MyVoucherRawItem) => ({
          id: uv.id,
          code: uv.code,
          title: uv.title || 'Voucher',
          description: uv.description || '',
          image: uv.image,
          redeemedAt: formatDateTime(uv.redeemedAt),
          rawRedeemedAt: uv.redeemedAt,
          expiryDays: uv.expiryDays,
          expiryDate: uv.expiryDate,
          isUsed: uv.isUsed
        }));
        setMyVouchers(formatted);
      } catch (err) {
        console.error(LABELS.LOYALTY.LOAD_MY_VOUCHERS_ERROR, err);
      } finally {
        setLoading(false);
      }
    }
    loadVouchersData();
  }, []);

  const checkVoucherExpired = (item: MyVoucherItem): boolean => {
    const now = new Date();
    if (item.expiryDate && now > new Date(item.expiryDate)) {
      return true;
    }
    if (item.rawRedeemedAt) {
      const redeemedTime = new Date(item.rawRedeemedAt).getTime();
      const expiryTime = redeemedTime + item.expiryDays * 24 * 60 * 60 * 1000;
      if (now.getTime() > expiryTime) {
        return true;
      }
    }
    return false;
  };

  const handleDeleteUserVoucher = async (userVoucherId: string) => {
    try {
      await voucherService.deleteUserVoucher(userVoucherId);
      toast.success(LABELS.LOYALTY.DELETE_USER_VOUCHER_SUCCESS);
      setMyVouchers(prev => prev.filter(v => v.id !== userVoucherId));
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.LOYALTY.DELETE_USER_VOUCHER_ERROR);
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
              <h2 className="text-h2 !text-2xl text-gray-900 dark:text-white">{LABELS.LOYALTY.TITLE}</h2>
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

      {/* Enter Point Code Section (CLAIM sub-tab) */}
      {activeSubTab === 'CLAIM' && (
        <div className="card-premium p-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <h3 className="text-md font-extrabold text-gray-800 dark:text-white">{LABELS.LOYALTY.CLAIM_POINT_CODE_TITLE}</h3>
              <p className="text-xs text-gray-400 font-bold mt-1 leading-relaxed">{LABELS.LOYALTY.CLAIM_POINT_CODE_DESC}</p>
            </div>
          </div>

          <form onSubmit={handleClaimPointCode} className="flex w-full md:w-auto items-center gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder={LABELS.LOYALTY.CLAIM_POINT_CODE_PLACEHOLDER}
              value={pointCodeInput}
              onChange={(e) => setPointCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none text-xs font-bold font-mono tracking-widest text-center focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 dark:text-white w-full md:w-36"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={claimingCode || pointCodeInput.length !== 6}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 cursor-pointer"
            >
              {claimingCode ? LABELS.LOYALTY.CLAIM_POINT_CODE_LOADING : LABELS.LOYALTY.CLAIM_POINT_CODE_BTN}
            </Button>
          </form>
        </div>
      )}

      {/* Redeemed Vouchers History (WALLET sub-tab) */}
      {activeSubTab === 'WALLET' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <h3 className="text-h3 text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={22} className="text-emerald-500" /> {LABELS.LOYALTY.MY_VOUCHERS_TITLE}
          </h3>

          <div className="card-premium p-6 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400 font-bold">
                {LABELS.COMMON.LOADING}
              </div>
            ) : myVouchers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Ticket size={36} className="mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                <p className="text-xs">{LABELS.LOYALTY.VOUCHER_EMPTY}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myVouchers.map((item, index) => {
                  const isExpired = checkVoucherExpired(item);
                  const isUsed = item.isUsed;
                  return (
                    <div
                      key={item.id || index}
                      className={`p-4 rounded-2xl border text-xs flex flex-col justify-between gap-3 transition-all ${
                        isUsed
                          ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 opacity-60'
                          : isExpired
                          ? 'bg-rose-50/30 dark:bg-rose-950/5 border-rose-100 dark:border-rose-900/20 opacity-75'
                          : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 hover:border-amber-200 transition-all'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className={`font-extrabold text-sm ${
                            isExpired || isUsed 
                              ? 'text-gray-400 line-through dark:text-slate-500' 
                              : 'text-gray-800 dark:text-white'
                          }`}>
                            {item.title}
                          </span>
                          {isUsed ? (
                            <span className="text-[10px] bg-slate-500/10 text-slate-500 dark:text-slate-400 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {LABELS.LOYALTY.STATUS_USED}
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] bg-rose-500/10 text-rose-500 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {LABELS.LOYALTY.STATUS_EXPIRED}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {LABELS.LOYALTY.STATUS_UNUSED}
                            </span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-mini text-gray-400 font-medium">{item.description}</p>
                        )}

                        <div className="flex justify-between items-center text-mini text-gray-400 font-bold mt-1">
                          <span>
                            {LABELS.LOYALTY.VOUCHER_CODE_PREFIX}
                            <code className={`font-mono px-1.5 py-0.5 rounded border ml-1 ${
                              isExpired || isUsed
                                ? 'bg-gray-100 dark:bg-slate-900 text-gray-400 border-gray-200 dark:border-slate-800' 
                                : 'text-gray-900 dark:text-white bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                            }`}>
                              {item.code}
                            </code>
                          </span>
                          <span>{item.redeemedAt}</span>
                        </div>
                      </div>

                      {/* Expiration warning or Delete for used voucher */}
                      {(isExpired || isUsed) && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-850">
                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                            {isExpired ? (
                              <>
                                <AlertCircle size={12} className="text-rose-500" /> 
                                <span className="text-rose-500">{LABELS.LOYALTY.EXPIRED_WARNING}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">{LABELS.LOYALTY.STATUS_USED_DESC}</span>
                              </>
                            )}
                          </span>
                          <Button
                            onClick={() => handleDeleteUserVoucher(item.id)}
                            variant="none"
                            size="none"
                            className="px-2.5 py-1 text-[10px] font-black text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                          >
                            {LABELS.LOYALTY.DELETE_BTN}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Vouchers to Redeem (MALL sub-tab) */}
      {activeSubTab === 'MALL' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <h3 className="text-h3 text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500 animate-pulse" /> {LABELS.LOYALTY.VOUCHERS_TITLE}
          </h3>
          
          {loadingMall ? (
            <div className="text-center py-12 text-gray-400 font-bold">
              {LABELS.COMMON.LOADING}
            </div>
          ) : mallVouchers.length === 0 ? (
            <div className="card-premium !p-16 text-center max-w-lg mx-auto">
              <Ticket className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-500 mb-1">{LABELS.OFFERS.EMPTY_TITLE}</h3>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                {LABELS.OFFERS.EMPTY_DESC}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedVouchers.map((group) => {
                const groupKey = group.id ? String(group.id) : 'system';
                const isExpanded = !!expandedGroups[groupKey];
                
                return (
                  <div
                    key={groupKey}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between p-5 text-left font-black text-gray-800 dark:text-white hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all outline-none cursor-pointer border-none"
                    >
                      <div className="flex items-center gap-3">
                        {group.id === null ? (
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">{group.name}</h4>
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                            {LABELS.LOYALTY.OFFERS_TO_REDEEM(group.list.length)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="text-gray-400" size={16} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={16} />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-6 pt-2 border-t border-gray-50 dark:border-slate-800/50 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {group.list.map((voucher) => {
                            const canAfford = currentPoints >= voucher.pointsCost;
                            return (
                              <div
                                key={voucher.id}
                                className={`card-premium p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                                  canAfford
                                    ? 'hover:border-primary/40 hover:-translate-y-1'
                                    : 'opacity-75'
                                } bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl`}
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

                                  <h4 className="text-body font-bold text-gray-800 dark:text-white mt-3">{voucher.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{voucher.description}</p>

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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
