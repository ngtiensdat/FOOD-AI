'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Tag, Plus, Trash2, Copy, Check, Search,
  Clock, Award, BarChart3, X, Gift, AlertCircle, CheckCircle2, Edit2, Star
} from 'lucide-react';
import { Button } from '@/components/base/Button';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { useVoucherManager, VoucherData, PointCodeData } from './useVoucherManager';
import { PromotionManager } from './PromotionManager';

interface VoucherManagerProps {
  restaurantId: number;
  restaurantName: string;
  activeSubTab?: 'VOUCHER' | 'POINT_CODE' | 'VERIFY_VOUCHER' | 'PROMOTION';
  onTabChange?: (tab: 'VOUCHER' | 'POINT_CODE' | 'VERIFY_VOUCHER' | 'PROMOTION') => void;
}



// ----------------------------------------------------
// Sub-component: VoucherStatsPanel
// ----------------------------------------------------
interface VoucherStatsPanelProps {
  total: number;
  active: number;
  totalClaims: number;
  claimRate: number;
}

const VoucherStatsPanel = ({ total, active, totalClaims, claimRate }: VoucherStatsPanelProps) => {
  const t = LABELS.VOUCHER_MANAGER.STATS;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Tag size={20} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.TOTAL}</span>
          <span className="text-lg font-black text-slate-800 dark:text-white">{total}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.ACTIVE}</span>
          <span className="text-lg font-black text-slate-800 dark:text-white">{active}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <Award size={20} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.CLAIMS}</span>
          <span className="text-lg font-black text-slate-800 dark:text-white">{totalClaims}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
          <BarChart3 size={20} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.USAGE_RATE}</span>
          <span className="text-lg font-black text-slate-800 dark:text-white">{claimRate}%</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Sub-component: VoucherFilterBar
// ----------------------------------------------------
interface VoucherFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
}

const VoucherFilterBar = ({ searchQuery, setSearchQuery, filterType, setFilterType }: VoucherFilterBarProps) => {
  const f = LABELS.VOUCHER_MANAGER.FILTER;
  const filterTabs = [
    { id: 'ALL', label: f.ALL },
    { id: 'DISCOUNT', label: f.DISCOUNT },
    { id: 'COMBO', label: f.COMBO },
    { id: 'GIFT', label: f.GIFT },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <div className="relative w-full md:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder={LABELS.VOUCHER_MANAGER.SEARCH_PLACEHOLDER}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Sub-component: VoucherRow
// ----------------------------------------------------
interface VoucherRowProps {
  voucher: VoucherData;
  copiedId: string | null;
  handleCopy: (code: string, id: string) => void;
  handleDeleteClick: (id: string) => void;
  handleEditClick: (voucher: VoucherData) => void;
}

const VoucherRow = ({ voucher, copiedId, handleCopy, handleDeleteClick, handleEditClick }: VoucherRowProps) => {
  const t = LABELS.VOUCHER_MANAGER.TABLE;

  const percentage = useMemo(() => {
    if (!voucher.quantity || voucher.quantity <= 0) return 0;
    return Math.min(Math.round(((voucher.usedCount ?? 0) / voucher.quantity) * 100), 100);
  }, [voucher.usedCount, voucher.quantity]);

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all text-xs">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 dark:border-slate-800">
            <SafeImage src={voucher.image || ''} alt={voucher.title} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <span className="text-slate-800 dark:text-white font-extrabold text-xs block truncate max-w-[200px]">{voucher.title}</span>
            <span className="text-[10px] text-gray-400 truncate block max-w-[200px] mt-0.5">{voucher.description}</span>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 font-mono">
        <button
          onClick={() => handleCopy(voucher.code, voucher.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-950 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-[10px] font-bold rounded-lg border border-gray-100 dark:border-slate-800 transition-all cursor-pointer"
        >
          <span className="uppercase tracking-wider">{voucher.code}</span>
          {copiedId === voucher.id ? (
            <Check size={10} className="text-emerald-500 shrink-0" />
          ) : (
            <Copy size={10} className="text-gray-400 shrink-0" />
          )}
        </button>
      </td>

      <td className="px-6 py-4">
        <span className="text-primary font-extrabold text-xs block">{voucher.discountValue}</span>
        <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold block mt-0.5">
          <span className="inline-flex items-center gap-0.5">
            <Star size={10} className="text-amber-500 fill-current" />
            {voucher.pointsCost} {t.POINTS_SUFFIX}
          </span>
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="space-y-1.5 w-32">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{voucher.usedCount ?? 0} {t.USED}</span>
            <span>{voucher.quantity} {t.TOTAL}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
          {t.ACTIVE}
        </span>
        <span className="text-[10px] text-gray-400 block mt-1">{t.DAYS_FROM_CLAIM(voucher.expiryDays)}</span>
      </td>

      <td className="px-6 py-4 text-right flex justify-end gap-2">
        <Button
          onClick={() => handleEditClick(voucher)}
          variant="none"
          size="none"
          className="p-2 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-xl transition-all cursor-pointer"
        >
          <Edit2 size={16} />
        </Button>
        <Button
          onClick={() => handleDeleteClick(voucher.id)}
          variant="none"
          size="none"
          className="p-2 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
        >
          <Trash2 size={16} />
        </Button>
      </td>
    </tr>
  );
};

// ----------------------------------------------------
// Main Component: VoucherManager
// ----------------------------------------------------
export const VoucherManager = ({ restaurantId, restaurantName, activeSubTab, onTabChange }: VoucherManagerProps) => {
  // DIP+SRP: Toàn bộ business logic được ủy quyền cho useVoucherManager hook
  const {
    t,
    activeTab, setActiveTab,
    vouchers, editingVoucher, pointCodes, loading, stats, filteredVouchers, currentTime,
    searchQuery, setSearchQuery, filterType, setFilterType, copiedId,
    verificationCode, setVerificationCode, verifying, verificationResult, applying,
    isOpenModal, setIsOpenModal,
    promoType, setPromoType, discountValue, setDiscountValue,
    minSpend, setMinSpend, pointsCost, setPointsCost,
    quantity, setQuantity, expiryDays, setExpiryDays,
    expiryDate, setExpiryDate, description, setDescription,
    promoTypeOptions, discountValues, quantities, pointsCosts, expiryDaysOptions, descriptions,
    pointAmountSelect, setPointAmountSelect, generatingCode, activeCode, timeLeft,
    confirmDeleteId, setConfirmDeleteId,
    handleOpenModal, handleEditClick, handleCopy, handleDelete,
    handleCreateVoucher, handleGeneratePointCode, handleVerifyVoucher, handleApplyVoucher,
  } = useVoucherManager({ restaurantId });

  // Sync controlled tab from parent
  useEffect(() => {
    if (activeSubTab) setActiveTab(activeSubTab);
  }, [activeSubTab, setActiveTab]);

  return (
    <div className="space-y-6">
      {!activeSubTab && (
        <div className="space-y-1 pb-2">
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="text-primary" size={22} />
            {t.TITLE}
          </h1>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed">
            {t.SUBTITLE}
          </p>
        </div>
      )}

      {/* Sub-tab Switcher & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-slate-800/80 pb-4">
        {!activeSubTab ? (
          <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-950 p-1 rounded-2xl w-fit">
            <button
              onClick={() => {
                setActiveTab('VOUCHER');
                if (onTabChange) onTabChange('VOUCHER');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'VOUCHER'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
              }`}
            >
              {t.TAB_VOUCHERS}
            </button>
            <button
              onClick={() => {
                setActiveTab('POINT_CODE');
                if (onTabChange) onTabChange('POINT_CODE');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'POINT_CODE'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
              }`}
            >
              {t.TAB_POINT_CODES}
            </button>
            <button
              onClick={() => {
                setActiveTab('VERIFY_VOUCHER');
                if (onTabChange) onTabChange('VERIFY_VOUCHER');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'VERIFY_VOUCHER'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
              }`}
            >
              {t.TAB_VERIFY_VOUCHER}
            </button>
            <button
              onClick={() => {
                setActiveTab('PROMOTION');
                if (onTabChange) onTabChange('PROMOTION');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'PROMOTION'
                  ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
              }`}
            >
              {t.TAB_PROMOTION}
            </button>
          </div>
        ) : <div />}

        {activeTab === 'VOUCHER' && (
          <Button
            variant="primary"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>{t.FORM.TITLE_CREATE}</span>
          </Button>
        )}
      </div>

      {activeTab === 'VOUCHER' && (
        <div className="space-y-6">
          <VoucherStatsPanel {...stats} />

          <VoucherFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
          />

          {loading ? (
            <div className="card-container p-12 text-center text-xs text-gray-400 font-bold bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-sm">
              {t.LOADING}
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="card-container p-16 text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-sm max-w-md mx-auto">
              <Tag className="mx-auto text-gray-200 mb-4" size={48} />
              <h4 className="font-extrabold text-sm text-gray-500 mb-1">{t.EMPTY_TITLE}</h4>
              <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                {t.EMPTY_DESC}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-gray-500">
                  <thead className="bg-gray-50 dark:bg-slate-950 text-gray-400 border-b border-gray-100 dark:border-slate-900">
                    <tr>
                      <th className="px-6 py-4">{t.TABLE.OFFER}</th>
                      <th className="px-6 py-4">{t.TABLE.CODE}</th>
                      <th className="px-6 py-4">{t.TABLE.VALUE}</th>
                      <th className="px-6 py-4">{t.TABLE.USAGE}</th>
                      <th className="px-6 py-4">{t.TABLE.VALIDITY}</th>
                      <th className="px-6 py-4 text-right">{t.TABLE.ACTION}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-900/50">
                    {filteredVouchers.map((voucher) => (
                      <VoucherRow
                        key={voucher.id}
                        voucher={voucher}
                        copiedId={copiedId}
                        handleCopy={handleCopy}
                        handleDeleteClick={setConfirmDeleteId}
                        handleEditClick={handleEditClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'POINT_CODE' && (
        /* Point Code Generator Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-white">{t.POINT_CODES.NEW_CODE_TITLE}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{t.POINT_CODES.NEW_CODE_DESC}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">{t.POINT_CODES.POINTS_VALUE_LABEL}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setPointAmountSelect(val)}
                      disabled={!!activeCode}
                      className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                        pointAmountSelect === val
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                          : 'bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Star size={11} className={`${pointAmountSelect === val ? 'text-white fill-current' : 'text-amber-500 fill-current'}`} />
                        {val}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                disabled={generatingCode || !!activeCode}
                onClick={handleGeneratePointCode}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {generatingCode ? t.POINT_CODES.GENERATING : t.POINT_CODES.GENERATE_BTN}
              </Button>

              {activeCode && (
                <div className="p-4 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 rounded-2xl text-center space-y-4 relative overflow-hidden animate-pulse">
                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">{t.POINT_CODES.CURRENT_CODE_LABEL}</span>
                    <span className="text-3xl font-black text-amber-500 tracking-widest font-mono block mt-1">
                      {activeCode.code.slice(0, 3)} {activeCode.code.slice(3)}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">{t.POINT_CODES.POINTS_VALUE_TEXT(activeCode.points)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                    <Clock size={14} className="text-amber-500" />
                    <span>{t.POINT_CODES.EXPIRES_IN} </span>
                    <span className="font-mono font-extrabold text-slate-800 dark:text-white">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium italic">{t.POINT_CODES.INSTRUCTION}</p>
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-white">{t.POINT_CODES.LOGS_TITLE}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{t.POINT_CODES.LOGS_DESC}</p>
              </div>

              {pointCodes.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 font-bold">
                  {t.POINT_CODES.LOGS_EMPTY}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold text-gray-500">
                    <thead className="bg-gray-50 dark:bg-slate-950 text-gray-400 border-b border-gray-100 dark:border-slate-900">
                      <tr>
                        <th className="px-6 py-4">{t.POINT_CODES.CODE_HEADER}</th>
                        <th className="px-6 py-4">{t.POINT_CODES.POINTS_HEADER}</th>
                        <th className="px-6 py-4">{t.POINT_CODES.EXPIRY_HEADER}</th>
                        <th className="px-6 py-4">{t.POINT_CODES.STATUS_HEADER}</th>
                        <th className="px-6 py-4">{t.POINT_CODES.USER_HEADER}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-900/50">
                      {pointCodes.map((code) => {
                        const isExpired = new Date(code.expiresAt).getTime() < currentTime && !code.usedById;
                        const isUsed = !!code.usedById;
                        const isActive = !isUsed && !isExpired;

                        return (
                          <tr key={code.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all">
                            <td className="px-6 py-4 font-mono font-extrabold text-slate-700 dark:text-white uppercase tracking-wider">{code.code}</td>
                            <td className="px-6 py-4 text-amber-500 font-black">
                              <span className="inline-flex items-center gap-1">
                                <Star size={12} className="text-amber-500 fill-current" />
                                {code.points}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-[10px]">
                              {new Date(code.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isUsed
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : isExpired
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {isUsed ? t.POINT_CODES.USED : isExpired ? t.TABLE.EXPIRED : t.POINT_CODES.PENDING}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {isUsed ? (
                                <div className="text-[10px]">
                                  <span className="text-slate-800 dark:text-white block font-extrabold">{code.usedByName}</span>
                                  <span className="text-gray-400 block text-[9px] font-bold mt-0.5">
                                    {t.POINT_CODES.CLAIMED_AT_LABEL} {new Date(code.usedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'VERIFY_VOUCHER' && (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                <Gift className="text-primary animate-pulse" size={20} />
                <span>{t.TAB_VERIFY_VOUCHER}</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                {t.VERIFY_VOUCHER.SUBTITLE}
              </p>
            </div>

            <form onSubmit={handleVerifyVoucher} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">
                  {t.VERIFY_VOUCHER.INPUT_LABEL}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={t.VERIFY_VOUCHER.INPUT_PLACEHOLDER}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase().trim())}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none text-xs font-bold font-mono tracking-wider focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 dark:text-white"
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={verifying || !verificationCode}
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-light text-white transition-all disabled:opacity-50 cursor-pointer shrink-0 animate-scale-in"
                  >
                    {verifying ? t.VERIFY_VOUCHER.VERIFYING : t.VERIFY_VOUCHER.BTN_VERIFY}
                  </Button>
                </div>
              </div>
            </form>

            {verificationResult && (
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800/80 animate-in slide-in-from-top-4 duration-300">
                {verificationResult.isValid ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 size={16} />
                      <span>{t.VERIFY_VOUCHER.STATUS_VALID}</span>
                    </div>

                    {verificationResult.details && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600 dark:text-slate-300 font-bold">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.CUSTOMER_NAME}</span>
                          <span className="text-slate-800 dark:text-white block mt-0.5">{verificationResult.details.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.DISCOUNT}</span>
                          <span className="text-primary text-sm font-black block mt-0.5">{verificationResult.details.discountValue}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.MIN_SPEND}</span>
                          <span className="text-slate-800 dark:text-white block mt-0.5">{verificationResult.details.minSpend}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.REDEEMED_AT}</span>
                          <span className="text-slate-800 dark:text-white block mt-0.5">
                            {new Date(verificationResult.details.redeemedAt).toLocaleDateString()} {new Date(verificationResult.details.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      disabled={applying}
                      onClick={handleApplyVoucher}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <Gift size={16} />
                      <span>{applying ? t.VERIFY_VOUCHER.APPLYING : t.VERIFY_VOUCHER.BTN_APPLY}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
                      <AlertCircle size={16} />
                      <span>{t.VERIFY_VOUCHER.STATUS_INVALID}</span>
                    </div>
                    <p className="text-xs text-rose-500 font-bold">{verificationResult.reason}</p>

                    {verificationResult.details && (
                      <div className="mt-2 pt-2 border-t border-rose-100/50 dark:border-rose-950/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-500 dark:text-slate-400 font-bold">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.CUSTOMER_NAME}</span>
                          <span className="block mt-0.5">{verificationResult.details.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.DISCOUNT}</span>
                          <span className="block mt-0.5">{verificationResult.details.discountValue}</span>
                        </div>
                        {verificationResult.details.isUsed && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t.VERIFY_VOUCHER.USED_AT}</span>
                            <span className="block mt-0.5 text-slate-700 dark:text-slate-300">
                              {verificationResult.details.usedAt ? (
                                <>
                                  {new Date(verificationResult.details.usedAt).toLocaleDateString()} {new Date(verificationResult.details.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </>
                              ) : (
                                '-'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'PROMOTION' && (
        <PromotionManager
          restaurantId={restaurantId}
          restaurantName={restaurantName}
        />
      )}

      {/* --- Create Voucher Modal --- */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-black">
                <Gift size={20} />
                <span className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">{t.FORM.TITLE_CREATE}</span>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Promo Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.TYPE_LABEL}</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER')}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  >
                    {promoTypeOptions.map((opt: { value: string; label: string }) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Discount Value (Manual) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.DISCOUNT_LABEL}</label>
                  <input
                    type="text"
                    required
                    placeholder="20% hoặc 50k..."
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Spend (Manual) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.MIN_SPEND_LABEL}</label>
                  <input
                    type="text"
                    required
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                {/* Quantity (Manual) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.QUANTITY_LABEL}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Points Cost (Manual) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.POINTS_COST_LABEL}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={pointsCost}
                    onChange={(e) => setPointsCost(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                {/* Expiry Days (Manual) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.EXPIRY_DAYS_LABEL}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Expiry Date (Redemption end date - Manual) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.EXPIRY_DATE_LABEL}</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.FORM.DESCRIPTION_LABEL}</label>
                <select
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                >
                  {descriptions.map((desc: string, idx: number) => (
                    <option key={idx} value={desc}>{desc}</option>
                  ))}
                </select>
              </div>

              {/* Note on Automatic Matching Image */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800/80 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">{t.FORM.AUTO_IMAGE_TITLE}</span>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1">
                    {t.FORM.AUTO_IMAGE_DESC}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {LABELS.COMMON.CANCEL}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-primary text-white"
                >
                  {t.FORM.SUBMIT_ADD}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Confirm Delete Modal --- */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle size={24} />
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-white">{t.TOAST.DELETE_CONFIRM_TITLE}</h3>
            </div>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              {t.TOAST.DELETE_CONFIRM_DESC}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDeleteId(null)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                {LABELS.COMMON.CANCEL}
              </Button>
              <Button
                variant="none"
                onClick={handleDelete}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10"
              >
                {LABELS.COMMON.DELETE}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
