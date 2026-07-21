/**
 * Mục đích: Component quản lý giao diện Trang ưu đãi & đổi Voucher tích điểm.
 * File liên quan: useOffers.ts, CreatePromotionModal.tsx, PromotionCard.tsx, VoucherCard.tsx
 * Design Pattern: Container Component (Smart Component)
 */
'use client';

import React from 'react';
import { Tag, Store, Gift, Flame, Percent, Sparkles, ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { User, UserRole } from '@/types/user';
import { CreatePromotionModal } from './CreatePromotionModal';
import { PromotionCard } from './PromotionCard';
import { VoucherCard } from './VoucherCard';

interface OffersSectionProps {
  user: Partial<User> | null;
  setActiveTab: (tab: string) => void;
}

export const OffersSection = ({ user, setActiveTab }: OffersSectionProps) => {
  const { login } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // DIP: Tất cả data fetching và business logic được ủy quyền cho useOffers hook
  const {
    activeSection,
    setActiveSection,
    filterType,
    setFilterType,
    loadingVouchers,
    groupedVouchers,
    filteredPromotions,
    expandedGroups,
    toggleGroup,
    handleDeleteOffer,
    handleRedeem,
    handleCreateOffer,
    searchQuery,
    setSearchQuery,
  } = useOffers({ user, login });

  const totalVouchers = React.useMemo(() => {
    return groupedVouchers.reduce((acc, group) => acc + group.list.length, 0);
  }, [groupedVouchers]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Left Sidebar (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Section Selector (moved from top) */}
          <div className="card-premium p-4 space-y-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider px-3 mb-2">
              {LABELS.OFFERS.TITLE}
            </span>
            
            <Button
              onClick={() => setActiveSection('PROMOTIONS')}
              variant="none"
              size="none"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'PROMOTIONS'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <Tag size={16} className={activeSection === 'PROMOTIONS' ? 'text-primary' : 'text-gray-400'} />
              <span>{LABELS.OFFERS.TABS.PROMOTIONS}</span>
            </Button>

            <Button
              onClick={() => setActiveSection('VOUCHERS')}
              variant="none"
              size="none"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'VOUCHERS'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                  : 'text-gray-600 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <Percent size={16} className={activeSection === 'VOUCHERS' ? 'text-primary' : 'text-gray-400'} />
              <span>{LABELS.OFFERS.TABS.VOUCHER_MALL}</span>
            </Button>
          </div>

          {/* Contextual Filter or Points Card */}
          {activeSection === 'PROMOTIONS' ? (
            <div className="card-premium p-4 space-y-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
              <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider px-3 mb-2">
                {LABELS.OFFERS.FILTER_TITLE}
              </span>
              {[
                { id: 'ALL', label: LABELS.OFFERS.FILTER.ALL, icon: Tag },
                { id: 'DISCOUNT', label: LABELS.OFFERS.FILTER.DISCOUNT, icon: Percent },
                { id: 'COMBO', label: LABELS.OFFERS.FILTER.COMBO, icon: Flame },
                { id: 'GIFT', label: LABELS.OFFERS.FILTER.GIFT, icon: Gift },
              ].map((tab) => {
                const isActive = filterType === tab.id;
                const Icon = tab.icon;

                return (
                  <Button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    variant="none"
                    size="none"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                        : 'text-gray-600 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            user && (
              <div className="card-premium p-5 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border border-amber-500/10 rounded-3xl text-center shadow-sm relative overflow-hidden">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{LABELS.LOYALTY.POINTS_BALANCE}</p>
                <p className="text-3xl font-black text-amber-500 mt-1.5 flex items-center justify-center gap-1.5 animate-pulse">
                  <span>⭐</span>
                  <span>{(user.points || 0).toLocaleString()}</span>
                </p>
              </div>
            )
          )}
        </div>

        {/* Center Column: Main Content Area (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {activeSection === 'PROMOTIONS' ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-900 pb-4 min-h-[44px] gap-4">
                <span className="text-xs font-bold text-gray-400">
                  {LABELS.OFFERS.SHOWING_COUNT(filteredPromotions.length)}
                </span>
                
                <div className="flex items-center gap-3">
                  {/* Search Input bar */}
                  <div className="relative w-64">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={LABELS.OFFERS.SEARCH_PLACEHOLDER}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2 pl-10 pr-8 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-200 dark:focus:ring-orange-500/10 text-xs text-gray-800 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white border-none bg-transparent cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {user?.role === UserRole.RESTAURANT && (
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      variant="primary"
                      size="none"
                      className="px-4 py-2 flex items-center gap-1.5 text-xs font-bold rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Plus size={14} />
                      {LABELS.OFFERS.CREATE_BTN}
                    </Button>
                  )}
                </div>
              </div>

              {filteredPromotions.length === 0 ? (
                <div className="card-container !p-16 text-center border-2 border-dashed !border-gray-100 dark:!border-slate-900 max-w-lg mx-auto">
                  <Tag className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-500 mb-1">{LABELS.OFFERS.EMPTY_TITLE}</h3>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                    {LABELS.OFFERS.EMPTY_DESC}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPromotions.map((offer) => (
                    <PromotionCard
                      key={offer.id}
                      offer={offer}
                      user={user}
                      onDelete={handleDeleteOffer}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* VOUCHERS Content */
            <>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-900 pb-4 min-h-[44px] gap-4">
                <span className="text-xs font-bold text-gray-400">
                  {LABELS.OFFERS.SHOWING_VOUCHERS(totalVouchers)}
                </span>

                {/* Search Input bar */}
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={LABELS.OFFERS.SEARCH_PLACEHOLDER}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2 pl-10 pr-8 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-200 dark:focus:ring-orange-500/10 text-xs text-gray-800 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white border-none bg-transparent cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {loadingVouchers ? (
                <div className="text-center py-12 text-gray-400 font-bold">
                  {LABELS.COMMON.LOADING}
                </div>
              ) : groupedVouchers.length === 0 ? (
                <div className="card-container !p-16 text-center border-2 border-dashed !border-gray-100 dark:!border-slate-900 max-w-lg mx-auto">
                  <Tag className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-500 mb-1">{LABELS.OFFERS.EMPTY_TITLE}</h3>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                    {LABELS.OFFERS.EMPTY_DESC}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {group.list.map((voucher) => (
                                <VoucherCard
                                  key={voucher.id}
                                  voucher={voucher}
                                  user={user}
                                  onRedeem={handleRedeem}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Balanced Mascot Card (col-span-3) */}
        <div className="lg:col-span-3 space-y-6 hidden lg:block">
          <div className="card-premium p-6 text-center space-y-4 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border border-amber-500/10 rounded-3xl">
            <div className="w-24 h-24 mx-auto relative shrink-0 select-none pointer-events-none">
              <img
                src="/chibi%20linh%20v%E1%BA%ADt/th%E1%BA%A3%20tim.png"
                alt="Mascot"
                className="w-full h-full object-contain filter drop-shadow-md animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </div>
            <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">{LABELS.OFFERS.RIGHT_CARD_TITLE}</h4>
            <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
              {LABELS.OFFERS.RIGHT_CARD_DESC}
            </p>
          </div>
        </div>

      </div>

      {/* Modal tạo khuyến mãi mới */}
      <CreatePromotionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOffer}
        user={user}
      />
    </div>
  );
};
